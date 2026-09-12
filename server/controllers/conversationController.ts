import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import { ConversationDB, MessageDB } from "../models/dbStore.ts";
import { emitConversationUpdate } from "../sockets/chatSocket.ts";

export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, category, search } = req.query as {
      status?: string;
      category?: string;
      search?: string;
    };

    if (user.role === "customer") {
      // Customers only see their own conversations
      const conversations = await ConversationDB.find({
        customerId: user._id,
        status,
        category,
        search,
      });
      res.status(200).json({ conversations });
      return;
    }

    // Agent can see all conversations, optionally filtered
    const conversations = await ConversationDB.find({
      status,
      category,
      search,
    });
    res.status(200).json({ conversations });
  } catch (error: any) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations." });
  }
}

export async function getConversationById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const conversation = await ConversationDB.findById(id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    // Role check: Customer can only view their own conversation
    const customerIdStr =
      typeof conversation.customerId === "object"
        ? String(conversation.customerId._id)
        : String(conversation.customerId);

    if (user.role === "customer" && customerIdStr !== user._id) {
      res.status(403).json({ error: "Unauthorized. You cannot access this conversation." });
      return;
    }

    res.status(200).json({ conversation });
  } catch (error: any) {
    console.error("Get conversation by id error:", error);
    res.status(500).json({ error: "Failed to fetch conversation details." });
  }
}

export async function createConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { subject, category, initialMessage } = req.body;

    if (!subject || !subject.trim()) {
      res.status(400).json({ error: "Conversation subject is required." });
      return;
    }

    const validCategories = ["Account", "Billing", "Technical Support", "General", "Other"];
    const selectedCategory = validCategories.includes(category) ? category : "General";

    const newConv = await ConversationDB.create({
      customerId: user._id,
      subject: subject.trim(),
      category: selectedCategory,
      status: "Open",
    });

    if (initialMessage && initialMessage.trim()) {
      await MessageDB.create({
        conversationId: String(newConv._id),
        senderId: user._id,
        message: initialMessage.trim(),
      });
    }

    const populatedConv = await ConversationDB.findById(String(newConv._id));

    // Notify agents via socket that a new conversation has been created
    emitConversationUpdate(String(newConv._id), populatedConv);

    res.status(201).json({
      message: "Conversation created successfully",
      conversation: populatedConv,
    });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Failed to create conversation." });
  }
}

export async function updateConversationStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
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

    // Customer permissions: can only close or reopen their own conversation
    if (user.role === "customer") {
      if (customerIdStr !== user._id) {
        res.status(403).json({ error: "Unauthorized." });
        return;
      }
      if (status !== "Closed" && status !== "Open") {
        res.status(400).json({
          error: "Customers can only set status to 'Closed' or reopen to 'Open'.",
        });
        return;
      }
    }

    const updated = await ConversationDB.updateStatus(id, status);
    emitConversationUpdate(id, updated);

    res.status(200).json({
      message: "Status updated successfully",
      conversation: updated,
    });
  } catch (error: any) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update conversation status." });
  }
}

export async function assignConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { agentId } = req.body;

    if (user.role !== "agent") {
      res.status(403).json({ error: "Only support agents can assign conversations." });
      return;
    }

    const targetAgentId = agentId ? String(agentId) : user._id;
    const updated = await ConversationDB.updateAgent(id, targetAgentId);

    if (!updated) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    // Automatically set status to In Progress if currently Open
    if (updated.status === "Open") {
      await ConversationDB.updateStatus(id, "In Progress");
    }

    const finalConv = await ConversationDB.findById(id);
    emitConversationUpdate(id, finalConv);

    res.status(200).json({
      message: "Conversation assigned successfully",
      conversation: finalConv,
    });
  } catch (error: any) {
    console.error("Assign conversation error:", error);
    res.status(500).json({ error: "Failed to assign conversation." });
  }
}

export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    if (user.role === "customer") {
      const allCustomerConvs = await ConversationDB.find({ customerId: user._id });
      const activeCount = allCustomerConvs.filter(
        (c) => c.status === "Open" || c.status === "In Progress"
      ).length;
      const resolvedCount = allCustomerConvs.filter(
        (c) => c.status === "Resolved" || c.status === "Closed"
      ).length;

      res.status(200).json({
        stats: {
          activeConversations: activeCount,
          resolvedConversations: resolvedCount,
          totalConversations: allCustomerConvs.length,
        },
      });
      return;
    }

    // Agent Stats
    const allConvs = await ConversationDB.find({});
    const activeChats = allConvs.filter((c) => c.status === "In Progress").length;
    const openConversations = allConvs.filter((c) => c.status === "Open").length;

    // Resolved today (or recently resolved)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = allConvs.filter((c) => {
      if (c.status !== "Resolved" && c.status !== "Closed") return false;
      const updated = new Date(c.updatedAt);
      return updated >= today;
    }).length;

    res.status(200).json({
      stats: {
        activeChats,
        openConversations,
        resolvedToday: resolvedToday || allConvs.filter((c) => c.status === "Resolved").length,
        averageResponseTime: "3m 45s",
        totalConversations: allConvs.length,
      },
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to load dashboard metrics." });
  }
}
