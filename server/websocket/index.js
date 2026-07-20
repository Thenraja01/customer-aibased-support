import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../modules/user/user.schema.js";
import { handleChatMessage, handleChatStream, handleCreateChat } from "./chat.handler.js";
import { handleTicketCreate, handleTicketCreateFromChat } from "./ticket.handler.js";

export const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id || decoded.userId)
        .select("-password")
        .lean();
      if (!user) {
        return next(new Error("User not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    socket.join(`user:${user._id}`);

    socket.on("chat:create", async (data, ack) => {
      try {
        const result = await handleCreateChat(socket, data);
        if (ack) ack({ success: true, data: result });
        socket.emit("chat:created", { data: result });
      } catch (err) {
        if (ack) ack({ success: false, message: err.message });
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("chat:send", async (data, ack) => {
      try {
        const result = await handleChatMessage(socket, data);
        if (ack) ack({ success: true, data: result });
        socket.emit("chat:response", { data: result });
      } catch (err) {
        if (ack) ack({ success: false, message: err.message });
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("chat:stream", async (data) => {
      try {
        await handleChatStream(socket, data);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("ticket:create", async (data, ack) => {
      try {
        const result = await handleTicketCreate(socket, data);
        if (ack) ack({ success: true, data: result });
        socket.emit("ticket:created", { data: result });
      } catch (err) {
        if (ack) ack({ success: false, message: err.message });
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("ticket:create-from-chat", async (data, ack) => {
      try {
        const result = await handleTicketCreateFromChat(socket, data);
        if (ack) ack({ success: true, data: result });
        socket.emit("ticket:created", { data: result });
      } catch (err) {
        if (ack) ack({ success: false, message: err.message });
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      socket.leave(`user:${user._id}`);
    });
  });

  return io;
};
