import bcrypt from "bcryptjs";
import { UserDB, ConversationDB, MessageDB } from "../models/dbStore.ts";

export async function seedDatabase() {
  try {
    const userCount = await UserDB.count();
    if (userCount > 0) {
      // Already seeded
      return;
    }

    console.log("[Seed] Seeding initial demo users and conversations...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Create Support Agents
    const agent = await UserDB.create({
      name: "Sarah Jenkins",
      email: "agent@support.com",
      password: hashedPassword,
      role: "agent",
    });

    const agent2 = await UserDB.create({
      name: "Marcus Vance",
      email: "marcus@support.com",
      password: hashedPassword,
      role: "agent",
    });

    // 2. Create Customers
    const customer = await UserDB.create({
      name: "Alex Morgan",
      email: "alex@customer.com",
      password: hashedPassword,
      role: "customer",
    });

    const customer2 = await UserDB.create({
      name: "David Kim",
      email: "david@customer.com",
      password: hashedPassword,
      role: "customer",
    });

    // 3. Conversation 1: Alex - Billing (In Progress)
    const conv1 = await ConversationDB.create({
      customerId: String(customer._id),
      subject: "Unable to update billing credit card",
      category: "Billing",
      status: "In Progress",
    });
    await ConversationDB.updateAgent(String(conv1._id), String(agent._id));

    await MessageDB.create({
      conversationId: String(conv1._id),
      senderId: String(customer._id),
      message: "Hi there! I am trying to update my company card under billing settings but getting a 402 error.",
    });

    await MessageDB.create({
      conversationId: String(conv1._id),
      senderId: String(agent._id),
      message: "Hello Alex! I would be glad to check this for you. Could you verify if the zip code matches your card's billing address?",
    });

    // 4. Conversation 2: Alex - Technical Support (Resolved)
    const conv2 = await ConversationDB.create({
      customerId: String(customer._id),
      subject: "Need API key rate limit increase",
      category: "Technical Support",
      status: "Resolved",
    });
    await ConversationDB.updateAgent(String(conv2._id), String(agent._id));

    await MessageDB.create({
      conversationId: String(conv2._id),
      senderId: String(customer._id),
      message: "Hi, our production service is hitting the default 60 req/min limit. Can we increase it to 300 req/min?",
    });

    await MessageDB.create({
      conversationId: String(conv2._id),
      senderId: String(agent._id),
      message: "Done! I have bumped your organization tier quota to 300 requests per minute on your account.",
    });

    await MessageDB.create({
      conversationId: String(conv2._id),
      senderId: String(customer._id),
      message: "Awesome, tested and working smoothly now. Thank you so much Sarah!",
    });

    // 5. Conversation 3: David - Open & Unassigned (For Agent to Claim)
    const conv3 = await ConversationDB.create({
      customerId: String(customer2._id),
      subject: "Webhook payload signatures failing SHA256 verification",
      category: "Technical Support",
      status: "Open",
    });

    await MessageDB.create({
      conversationId: String(conv3._id),
      senderId: String(customer2._id),
      message: "Hello! We are receiving webhook dispatches from your endpoint, but our SHA256 signature verification keeps failing. Are raw body bytes hashed with UTF-8 encoding?",
    });

    // 6. Conversation 4: Alex - Account (Closed)
    const conv4 = await ConversationDB.create({
      customerId: String(customer._id),
      subject: "Two-factor authentication hardware key setup",
      category: "Account",
      status: "Closed",
    });
    await ConversationDB.updateAgent(String(conv4._id), String(agent2._id));

    await MessageDB.create({
      conversationId: String(conv4._id),
      senderId: String(customer._id),
      message: "Is it possible to register a FIDO2 / YubiKey hardware key for my login?",
    });

    await MessageDB.create({
      conversationId: String(conv4._id),
      senderId: String(agent2._id),
      message: "Yes! Navigate to Account Settings > Security > Multi-Factor Authentication and select 'Add Security Key'.",
    });

    console.log("[Seed] Successfully seeded mock demo data:");
    console.log("  Agent: agent@support.com / password123 (Sarah Jenkins)");
    console.log("  Customer: alex@customer.com / password123 (Alex Morgan)");
    console.log("  Customer: david@customer.com / password123 (David Kim)");
  } catch (error) {
    console.error("[Seed] Error seeding database:", error);
  }
}
