import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "./env.js";
import { allowedOrigins } from "./cors.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.userId || socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("join:chat", (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave:chat", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("typing:start", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { chatId, userId });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
    });

    socket.on("disconnect", () => {
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
