import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  _id: any;
  conversationId: any;
  senderId: any;
  message: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
});

export const MessageModel =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
