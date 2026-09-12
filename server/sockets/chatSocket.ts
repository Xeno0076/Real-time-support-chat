import { Server as SocketIOServer, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { UserDB, ConversationDB, MessageDB } from "../models/dbStore.ts";

let ioInstance: SocketIOServer | null = null;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";

// Track active online users: userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export function setupSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      if (!token) {
        // Socket can connect as guest or authenticate later
        return next();
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      const user = await UserDB.findById(decoded.id);
      if (user) {
        (socket as any).user = {
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
      next();
    } catch (err) {
      // Allow connection but without authenticated user attached
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const authUser = (socket as any).user;
    if (authUser) {
      const userId = authUser._id;
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Broadcast user online status
      io.emit("user_presence", {
        userId,
        status: "online",
      });
    }

    // Authenticate socket on-the-fly (e.g., after client logs in without full reload)
    socket.on("authenticate", async (token: string) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        const user = await UserDB.findById(decoded.id);
        if (user) {
          (socket as any).user = {
            _id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
          };
          const userId = String(user._id);
          if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
          }
          onlineUsers.get(userId)!.add(socket.id);

          socket.emit("authenticated", { user: (socket as any).user });
          io.emit("user_presence", { userId, status: "online" });
        }
      } catch (err) {
        socket.emit("auth_error", { message: "Failed to authenticate socket" });
      }
    });

    // 1. Join Conversation Room
    socket.on("join_conversation", async ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;

      const user = (socket as any).user;
      if (!user) {
        socket.emit("error_message", { message: "Authentication required to join room." });
        return;
      }

      const conversation = await ConversationDB.findById(conversationId);
      if (!conversation) {
        socket.emit("error_message", { message: "Conversation not found." });
        return;
      }

      const customerIdStr =
        typeof conversation.customerId === "object"
          ? String(conversation.customerId._id)
          : String(conversation.customerId);

      // Verify user has permission (customer must own it, or user is agent)
      if (user.role === "customer" && customerIdStr !== user._id) {
        socket.emit("error_message", { message: "Unauthorized access to this conversation." });
        return;
      }

      const room = `conversation:${conversationId}`;
      socket.join(room);

      socket.to(room).emit("user_joined_room", {
        userId: user._id,
        userName: user.name,
        role: user.role,
      });
    });

    // 2. Leave Conversation Room
    socket.on("leave_conversation", ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      const room = `conversation:${conversationId}`;
      socket.leave(room);

      const user = (socket as any).user;
      if (user) {
        socket.to(room).emit("user_left_room", {
          userId: user._id,
          userName: user.name,
        });
      }
    });

    // 3. Send Message through Socket
    socket.on(
      "send_message",
      async ({ conversationId, message }: { conversationId: string; message: string }) => {
        const user = (socket as any).user;
        if (!user) {
          socket.emit("error_message", { message: "Authentication required to send message." });
          return;
        }

        if (!conversationId || !message || !message.trim()) {
          socket.emit("error_message", { message: "Conversation ID and message content are required." });
          return;
        }

        const conversation = await ConversationDB.findById(conversationId);
        if (!conversation) {
          socket.emit("error_message", { message: "Conversation not found." });
          return;
        }

        const customerIdStr =
          typeof conversation.customerId === "object"
            ? String(conversation.customerId._id)
            : String(conversation.customerId);

        if (user.role === "customer" && customerIdStr !== user._id) {
          socket.emit("error_message", { message: "Unauthorized to send in this conversation." });
          return;
        }

        // Save message to database
        const savedMessage = await MessageDB.create({
          conversationId,
          senderId: user._id,
          message: message.trim(),
        });

        // Update conversation state if agent replies
        if (user.role === "agent") {
          if (conversation.status === "Open") {
            await ConversationDB.updateStatus(conversationId, "In Progress");
          }
          if (!conversation.agentId) {
            await ConversationDB.updateAgent(conversationId, user._id);
          }
        }

        // Broadcast to all participants in this room
        const room = `conversation:${conversationId}`;
        io.to(room).emit("receive_message", savedMessage);

        // Also emit a general conversation_updated event so sidebar/lists update
        const updatedConv = await ConversationDB.findById(conversationId);
        io.emit("conversation_updated", updatedConv);
      }
    );

    // 4. Typing Indicator
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      const user = (socket as any).user;
      if (!user || !conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        conversationId,
        userId: user._id,
        userName: user.name,
        role: user.role,
      });
    });

    socket.on("stop_typing", ({ conversationId }: { conversationId: string }) => {
      const user = (socket as any).user;
      if (!user || !conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
        conversationId,
        userId: user._id,
      });
    });

    // 5. Disconnect
    socket.on("disconnect", () => {
      const authUser = (socket as any).user;
      if (authUser) {
        const userId = authUser._id;
        const set = onlineUsers.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            onlineUsers.delete(userId);
            io.emit("user_presence", { userId, status: "offline" });
          }
        }
      }
    });
  });
}

export function emitNewMessage(conversationId: string, message: any) {
  if (!ioInstance) return;
  ioInstance.to(`conversation:${conversationId}`).emit("receive_message", message);
}

export function emitConversationUpdate(conversationId: string, conversation: any) {
  if (!ioInstance) return;
  ioInstance.to(`conversation:${conversationId}`).emit("conversation_detail_updated", conversation);
  ioInstance.emit("conversation_updated", conversation);
}
