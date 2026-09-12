import { UserModel } from "./User.ts";
import { ConversationModel } from "./Conversation.ts";
import { MessageModel } from "./Message.ts";
import { getIsMongoConnected } from "../config/db.ts";

// Helper to create 24-character hexadecimal IDs similar to MongoDB ObjectId
export function generateMongoId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = "xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
  return `${timestamp}${random}`;
}

// In-memory collections for local fallback
const memoryUsers: any[] = [];
const memoryConversations: any[] = [];
const memoryMessages: any[] = [];

export const UserDB = {
  async findOne(filter: { email?: string; _id?: string }): Promise<any | null> {
    if (getIsMongoConnected()) {
      try {
        const query: any = {};
        if (filter.email) query.email = filter.email.toLowerCase();
        if (filter._id) query._id = filter._id;
        return await UserModel.findOne(query).lean();
      } catch (err) {
        console.error("MongoDB findOne User error:", err);
      }
    }
    return (
      memoryUsers.find((u) => {
        if (filter.email && u.email.toLowerCase() === filter.email.toLowerCase()) return true;
        if (filter._id && String(u._id) === String(filter._id)) return true;
        return false;
      }) || null
    );
  },

  async findById(id: string): Promise<any | null> {
    return this.findOne({ _id: id });
  },

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role: "customer" | "agent";
  }): Promise<any> {
    if (getIsMongoConnected()) {
      try {
        const user = await UserModel.create({
          ...userData,
          email: userData.email.toLowerCase(),
        });
        return user.toObject ? user.toObject() : user;
      } catch (err) {
        console.error("MongoDB create User error:", err);
      }
    }
    const newUser = {
      _id: generateMongoId(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      role: userData.role || "customer",
      createdAt: new Date(),
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  async count(): Promise<number> {
    if (getIsMongoConnected()) {
      try {
        return await UserModel.countDocuments();
      } catch (err) {
        console.error("MongoDB count error:", err);
      }
    }
    return memoryUsers.length;
  },
};

export const ConversationDB = {
  async find(filter: {
    customerId?: string;
    agentId?: string;
    status?: string;
    category?: string;
    search?: string;
  } = {}): Promise<any[]> {
    if (getIsMongoConnected()) {
      try {
        const query: any = {};
        if (filter.customerId) query.customerId = filter.customerId;
        if (filter.agentId) query.agentId = filter.agentId;
        if (filter.status && filter.status !== "All") query.status = filter.status;
        if (filter.category && filter.category !== "All") query.category = filter.category;
        if (filter.search) {
          query.$or = [
            { subject: { $regex: filter.search, $options: "i" } },
          ];
        }

        const convs = await ConversationModel.find(query)
          .populate("customerId", "name email role")
          .populate("agentId", "name email role")
          .sort({ updatedAt: -1 })
          .lean();

        return convs;
      } catch (err) {
        console.error("MongoDB find Conversation error:", err);
      }
    }

    let results = [...memoryConversations];

    if (filter.customerId) {
      results = results.filter((c) => String(c.customerId) === String(filter.customerId));
    }
    if (filter.agentId) {
      results = results.filter((c) => String(c.agentId) === String(filter.agentId));
    }
    if (filter.status && filter.status !== "All") {
      results = results.filter((c) => c.status === filter.status);
    }
    if (filter.category && filter.category !== "All") {
      results = results.filter((c) => c.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter((c) => {
        const matchSubject = c.subject?.toLowerCase().includes(q);
        const cust = memoryUsers.find((u) => String(u._id) === String(c.customerId));
        const matchCustomer = cust && (cust.name.toLowerCase().includes(q) || cust.email.toLowerCase().includes(q));
        return matchSubject || matchCustomer;
      });
    }

    // Populate customerId and agentId
    const populated = results.map((c) => {
      const customer = memoryUsers.find((u) => String(u._id) === String(c.customerId));
      const agent = c.agentId ? memoryUsers.find((u) => String(u._id) === String(c.agentId)) : null;
      return {
        ...c,
        customerId: customer
          ? { _id: customer._id, name: customer.name, email: customer.email, role: customer.role }
          : c.customerId,
        agentId: agent
          ? { _id: agent._id, name: agent.name, email: agent.email, role: agent.role }
          : null,
      };
    });

    return populated.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async findById(id: string): Promise<any | null> {
    if (getIsMongoConnected()) {
      try {
        const conv = await (ConversationModel as any).findById(id)
          .populate("customerId", "name email role")
          .populate("agentId", "name email role")
          .lean();
        return conv;
      } catch (err) {
        console.error("MongoDB findById Conversation error:", err);
      }
    }

    const c = memoryConversations.find((item) => String(item._id) === String(id));
    if (!c) return null;

    const customer = memoryUsers.find((u) => String(u._id) === String(c.customerId));
    const agent = c.agentId ? memoryUsers.find((u) => String(u._id) === String(c.agentId)) : null;

    return {
      ...c,
      customerId: customer
        ? { _id: customer._id, name: customer.name, email: customer.email, role: customer.role }
        : c.customerId,
      agentId: agent
        ? { _id: agent._id, name: agent.name, email: agent.email, role: agent.role }
        : null,
    };
  },

  async create(data: {
    customerId: string;
    subject: string;
    category: string;
    status?: string;
  }): Promise<any> {
    if (getIsMongoConnected()) {
      try {
        const conv = await ConversationModel.create({
          ...data,
          status: data.status || "Open",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return conv.toObject ? conv.toObject() : conv;
      } catch (err) {
        console.error("MongoDB create Conversation error:", err);
      }
    }

    const newConv = {
      _id: generateMongoId(),
      customerId: data.customerId,
      agentId: null,
      subject: data.subject.trim(),
      category: data.category,
      status: data.status || "Open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryConversations.push(newConv);
    return newConv;
  },

  async updateStatus(id: string, status: string): Promise<any | null> {
    if (getIsMongoConnected()) {
      try {
        const updated = await (ConversationModel as any).findByIdAndUpdate(
          id,
          { status, updatedAt: new Date() },
          { new: true }
        )
          .populate("customerId", "name email role")
          .populate("agentId", "name email role")
          .lean();
        return updated;
      } catch (err) {
        console.error("MongoDB updateStatus error:", err);
      }
    }

    const index = memoryConversations.findIndex((c) => String(c._id) === String(id));
    if (index === -1) return null;

    memoryConversations[index].status = status;
    memoryConversations[index].updatedAt = new Date();
    return this.findById(id);
  },

  async updateAgent(id: string, agentId: string | null): Promise<any | null> {
    if (getIsMongoConnected()) {
      try {
        const updated = await (ConversationModel as any).findByIdAndUpdate(
          id,
          { agentId, updatedAt: new Date() },
          { new: true }
        )
          .populate("customerId", "name email role")
          .populate("agentId", "name email role")
          .lean();
        return updated;
      } catch (err) {
        console.error("MongoDB updateAgent error:", err);
      }
    }

    const index = memoryConversations.findIndex((c) => String(c._id) === String(id));
    if (index === -1) return null;

    memoryConversations[index].agentId = agentId;
    memoryConversations[index].updatedAt = new Date();
    return this.findById(id);
  },

  async touch(id: string): Promise<void> {
    if (getIsMongoConnected()) {
      try {
        await (ConversationModel as any).findByIdAndUpdate(id, { updatedAt: new Date() });
        return;
      } catch (err) {
        console.error("MongoDB touch error:", err);
      }
    }
    const c = memoryConversations.find((item) => String(item._id) === String(id));
    if (c) {
      c.updatedAt = new Date();
    }
  },
};

export const MessageDB = {
  async findByConversation(conversationId: string): Promise<any[]> {
    if (getIsMongoConnected()) {
      try {
        const msgs = await (MessageModel as any).find({ conversationId })
          .populate("senderId", "name email role")
          .sort({ timestamp: 1 })
          .lean();
        return msgs;
      } catch (err) {
        console.error("MongoDB findByConversation error:", err);
      }
    }

    const msgs = memoryMessages.filter(
      (m) => String(m.conversationId) === String(conversationId)
    );

    const populated = msgs.map((m) => {
      const sender = memoryUsers.find((u) => String(u._id) === String(m.senderId));
      return {
        ...m,
        senderId: sender
          ? { _id: sender._id, name: sender.name, email: sender.email, role: sender.role }
          : m.senderId,
      };
    });

    return populated.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  async create(data: {
    conversationId: string;
    senderId: string;
    message: string;
  }): Promise<any> {
    if (getIsMongoConnected()) {
      try {
        const newMsg = await (MessageModel as any).create({
          ...data,
          timestamp: new Date(),
        });
        await ConversationDB.touch(data.conversationId);
        const populated = await (MessageModel as any).findById(newMsg._id)
          .populate("senderId", "name email role")
          .lean();
        return populated;
      } catch (err) {
        console.error("MongoDB create Message error:", err);
      }
    }

    const newMsg = {
      _id: generateMongoId(),
      conversationId: data.conversationId,
      senderId: data.senderId,
      message: data.message.trim(),
      timestamp: new Date(),
    };
    memoryMessages.push(newMsg);
    await ConversationDB.touch(data.conversationId);

    const sender = memoryUsers.find((u) => String(u._id) === String(data.senderId));
    return {
      ...newMsg,
      senderId: sender
        ? { _id: sender._id, name: sender.name, email: sender.email, role: sender.role }
        : data.senderId,
    };
  },
};
