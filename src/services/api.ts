import { Conversation, Message, CustomerStats, AgentStats, User } from "../types.ts";

const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get user profile");
    return data;
  },

  async demoLogin(role: "agent" | "customer"): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Demo login failed");
    return data;
  },

  // Conversations
  async getConversations(params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ conversations: Conversation[] }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "All") query.append("status", params.status);
    if (params?.category && params.category !== "All") query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/conversations${qs}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch conversations");
    return data;
  },

  async getConversationById(id: string): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch conversation");
    return data;
  },

  async createConversation(payload: {
    subject: string;
    category: string;
    initialMessage?: string;
  }): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create conversation");
    return data;
  },

  async updateConversationStatus(
    id: string,
    status: string
  ): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/conversations/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update status");
    return data;
  },

  async assignConversation(
    id: string,
    agentId?: string
  ): Promise<{ conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/conversations/${id}/assign`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ agentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to assign conversation");
    return data;
  },

  async getStats(): Promise<{ stats: CustomerStats | AgentStats }> {
    const res = await fetch(`${API_BASE}/conversations/stats`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
    return data;
  },

  // Messages
  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
    return data;
  },

  async sendMessage(conversationId: string, message: string): Promise<{ data: Message }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send message");
    return data;
  },
};
