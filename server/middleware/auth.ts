import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserDB } from "../models/dbStore.ts";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: "customer" | "agent";
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({ error: "Access denied. Authentication token is missing." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: "customer" | "agent" };
    const user = await UserDB.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: "Invalid token. User no longer exists." });
      return;
    }

    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err: any) {
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export function requireRole(allowedRole: "agent" | "customer") {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (req.user.role !== allowedRole) {
      res.status(403).json({
        error: `Forbidden. Only users with the '${allowedRole}' role can access this resource.`,
      });
      return;
    }

    next();
  };
}

export function generateToken(user: { _id: any; email: string; role: string }): string {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
