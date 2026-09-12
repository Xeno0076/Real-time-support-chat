import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserDB } from "../models/dbStore.ts";
import { generateToken } from "../middleware/auth.ts";
import type { AuthRequest } from "../middleware/auth.ts";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }

    const existingUser = await UserDB.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "An account with this email address already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Enforce role to "customer". Users cannot self-register as agents.
    const newUser = await UserDB.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "customer",
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Customer registration successful",
      token,
      user: {
        _id: String(newUser._id),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user. Please try again." });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await UserDB.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await UserDB.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body; // 'agent' or 'customer'
    const email = role === "agent" ? "agent@support.com" : "alex@customer.com";

    const user = await UserDB.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "Demo account not initialized." });
      return;
    }

    const token = generateToken(user);
    res.status(200).json({
      message: `Logged in as demo ${role}`,
      token,
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to login with demo account." });
  }
}
