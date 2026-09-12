import express from "express";
import http from "http";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { connectDB } from "./server/config/db.ts";
import { seedDatabase } from "./server/config/seed.ts";
import { setupSocketIO } from "./server/sockets/chatSocket.ts";
import authRoutes from "./server/routes/authRoutes.ts";
import conversationRoutes from "./server/routes/conversationRoutes.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Connect to Database and Seed Demo Data
  await connectDB();
  await seedDatabase();

  // Create HTTP Server & Mount Socket.IO
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  setupSocketIO(io);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Real-Time Customer Support API" });
  });

  // REST API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/conversations", conversationRoutes);

  // Vite middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Real-Time Support Chat Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal error during startup:", err);
});
