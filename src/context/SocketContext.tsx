import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext.tsx";
import { Message, Conversation } from "../types.ts";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  activeTypingUsers: { [conversationId: string]: string[] };
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendSocketMessage: (conversationId: string, message: string) => void;
  emitTyping: (conversationId: string) => void;
  emitStopTyping: (conversationId: string) => void;
  onMessageReceived: (callback: (msg: Message) => void) => () => void;
  onConversationUpdated: (callback: (conv: Conversation) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeTypingUsers, setActiveTypingUsers] = useState<{ [conversationId: string]: string[] }>({});

  // Callbacks registry
  const messageCallbacks = useRef<Set<(msg: Message) => void>>(new Set());
  const conversationCallbacks = useRef<Set<(conv: Conversation) => void>>(new Set());

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io({
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      if (token) {
        newSocket.emit("authenticate", token);
      }
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[Socket] Connection notice:", err.message);
      setIsConnected(false);
    });

    newSocket.on("receive_message", (message: Message) => {
      messageCallbacks.current.forEach((cb) => cb(message));
    });

    newSocket.on("conversation_updated", (conv: Conversation) => {
      conversationCallbacks.current.forEach((cb) => cb(conv));
    });

    newSocket.on("conversation_detail_updated", (conv: Conversation) => {
      conversationCallbacks.current.forEach((cb) => cb(conv));
    });

    newSocket.on("user_presence", ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    newSocket.on("user_typing", ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setActiveTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        if (!list.includes(userName)) {
          return { ...prev, [conversationId]: [...list, userName] };
        }
        return prev;
      });
    });

    newSocket.on("user_stop_typing", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setActiveTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.filter((name) => name !== userId),
        };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Authenticate socket if user logs in after connection
  useEffect(() => {
    if (socketRef.current && token && isConnected) {
      socketRef.current.emit("authenticate", token);
    }
  }, [token, isConnected]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join_conversation", { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_conversation", { conversationId });
    }
  }, []);

  const sendSocketMessage = useCallback((conversationId: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", { conversationId, message });
    }
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { conversationId });
    }
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("stop_typing", { conversationId });
    }
  }, []);

  const onMessageReceived = useCallback((callback: (msg: Message) => void) => {
    messageCallbacks.current.add(callback);
    return () => {
      messageCallbacks.current.delete(callback);
    };
  }, []);

  const onConversationUpdated = useCallback((callback: (conv: Conversation) => void) => {
    conversationCallbacks.current.add(callback);
    return () => {
      conversationCallbacks.current.delete(callback);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        activeTypingUsers,
        joinConversation,
        leaveConversation,
        sendSocketMessage,
        emitTyping,
        emitStopTyping,
        onMessageReceived,
        onConversationUpdated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
