import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: any;
  name: string;
  email: string;
  password: string;
  role: "customer" | "agent";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "agent"], default: "customer" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
