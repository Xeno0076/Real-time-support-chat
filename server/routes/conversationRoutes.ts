import express from "express";
import {
  getConversations,
  getConversationById,
  createConversation,
  updateConversationStatus,
  assignConversation,
  getDashboardStats,
} from "../controllers/conversationController.ts";
import { getMessages, createMessage } from "../controllers/messageController.ts";
import { authenticateToken, requireRole } from "../middleware/auth.ts";

const router = express.Router();

// Apply authentication to all conversation routes
router.use(authenticateToken);

// Conversation CRUD & actions
router.get("/", getConversations);
router.get("/stats", getDashboardStats);
router.get("/:id", getConversationById);
router.post("/", createConversation);
router.patch("/:id/status", updateConversationStatus);
router.patch("/:id/assign", requireRole("agent"), assignConversation);

// Messages nested endpoints
router.get("/:id/messages", getMessages);
router.post("/:id/messages", createMessage);

export default router;
