export type UserRole = "customer" | "agent";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type ConversationCategory =
  | "Account"
  | "Billing"
  | "Technical Support"
  | "General"
  | "Other";

export type ConversationStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Conversation {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  agentId?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  subject: string;
  category: ConversationCategory;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  } | string;
  message: string;
  timestamp: string;
}

export interface CustomerStats {
  activeConversations: number;
  resolvedConversations: number;
  totalConversations: number;
}

export interface AgentStats {
  activeChats: number;
  openConversations: number;
  resolvedToday: number;
  averageResponseTime: string;
  totalConversations: number;
}
