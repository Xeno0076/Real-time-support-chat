import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  _id: any;
  customerId: any;
  agentId?: any;
  subject: string;
  category: "Account" | "Billing" | "Technical Support" | "General" | "Other";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Account", "Billing", "Technical Support", "General", "Other"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
