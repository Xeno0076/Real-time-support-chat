import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import { ConversationDB, MessageDB } from "../models/dbStore.ts";
import { emitNewMessage } from "../sockets/chatSocket.ts";

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params; // conversationId

    const conversation = await ConversationDB.findById(id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const customerIdStr =
      typeof conversation.customerId === "object"
        ? String(conversation.customerId._id)
        : String(conversation.customerId);

    if (user.role === "customer" && customerIdStr !== user._id) {
      res.status(403).json({ error: "Unauthorized. You cannot view messages in this conversation." });
      return;
    }

    const messages = await MessageDB.findByConversation(id);
    res.status(200).json({ messages });
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
}

export async function createMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params; // conversationId
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: "Message cannot be empty." });
      return;
    }

    const conversation = await ConversationDB.findById(id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const customerIdStr =
      typeof conversation.customerId === "object"
        ? String(conversation.customerId._id)
        : String(conversation.customerId);

    if (user.role === "customer" && customerIdStr !== user._id) {
      res.status(403).json({ error: "Unauthorized. You cannot send messages in this conversation." });
      return;
    }

    // Save message in database
    const savedMessage = await MessageDB.create({
      conversationId: id,
      senderId: user._id,
      message: message.trim(),
    });

    // If conversation was 'Open' and agent replies, auto-set to 'In Progress' and assign
    if (user.role === "agent") {
      if (conversation.status === "Open") {
        await ConversationDB.updateStatus(id, "In Progress");
      }
      if (!conversation.agentId) {
        await ConversationDB.updateAgent(id, user._id);
      }
    }

    // Real-time broadcast via Socket.IO
    emitNewMessage(id, savedMessage);

    res.status(201).json({
      message: "Message sent successfully",
      data: savedMessage,
    });
  } catch (error: any) {
    console.error("Create message error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
}
