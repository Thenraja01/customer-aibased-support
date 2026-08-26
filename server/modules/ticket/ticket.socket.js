import mongoose from "mongoose";
import Ticket from "./ticket.schema.js";
import * as ticketMessageService from "./ticketMessage.service.js";
import { sendTicketMessageWorkflow } from "./ticketWorkflow.service.js";

const STAFF_ROLES = ["super_admin", "admin", "branch_admin", "support"];

/**
 * Resolve a ticket and check the socket user's access before allowing them to
 * join a ticket room or read/write in it. Identity comes from the verified
 * JWT (socket.user), never from the client payload.
 */
export const canAccessTicket = async (user, ticketId, ticketDoc = null) => {
  if (!user?.userId || !ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) return null;
  let ticket = ticketDoc;
  if (!ticket) {
    if (mongoose.connection.readyState !== 1) return null;
    ticket = await Ticket.findById(ticketId)
      .select("organization_id branch_id user_id status ticket_number")
      .lean();
  }
  if (!ticket) return null;

  const role = (user.roleName || "").toLowerCase();

  if (role === "super_admin") return ticket;

  if (user.organizationId && ticket.organization_id) {
    if (ticket.organization_id.toString() !== user.organizationId.toString()) return null;
  }

  if (STAFF_ROLES.includes(role)) {
    if (role !== "admin" && role !== "super_admin") {
      if (user.branchId && ticket.branch_id) {
        if (ticket.branch_id.toString() !== user.branchId.toString()) return null;
      }
    }
    return ticket;
  }

  if (role === "customer") {
    return ticket.user_id && ticket.user_id.toString() === user.userId.toString() ? ticket : null;
  }

  return null;
};

export const registerTicketSocketHandlers = (io, socket) => {
  const user = socket.user || {};

  socket.on("join:ticket", async ({ ticketId }, cb) => {
    const ticket = await canAccessTicket(user, ticketId);
    if (!ticket) {
      cb?.({ ok: false, message: "Forbidden" });
      return;
    }
    socket.join(`ticket:${ticketId}`);
    socket.data.ticketId = ticketId;
    socket.to(`ticket:${ticketId}`).emit("ticket:presence", {
      ticketId,
      userId: user.userId,
      role: user.roleName,
      online: true,
    });
    cb?.({ ok: true, ticket: { id: ticket._id, status: ticket.status, ticket_number: ticket.ticket_number } });
  });

  socket.on("leave:ticket", ({ ticketId }, cb) => {
    socket.leave(`ticket:${ticketId}`);
    socket.to(`ticket:${ticketId}`).emit("ticket:presence", {
      ticketId,
      userId: user.userId,
      role: user.roleName,
      online: false,
    });
    cb?.({ ok: true });
  });

  socket.on("ticket:send-message", async (data, cb) => {
    const { ticketId, content, attachments, isInternal } = data || {};
    const ticket = await canAccessTicket(user, ticketId);
    if (!ticket) {
      cb?.({ ok: false, message: "Forbidden" });
      return;
    }
    try {
      const msg = await sendTicketMessageWorkflow({
        ticket: { ...ticket, user_id: { _id: ticket.user_id }, _id: ticket._id },
        senderUserId: user.userId,
        senderRole: user.roleName,
        senderName: user.name || "Support",
        content,
        attachments: attachments || [],
        isInternal,
      });
      cb?.({ ok: true, data: msg });
    } catch (err) {
      cb?.({ ok: false, message: err.message });
    }
  });

  socket.on("ticket:typing", ({ ticketId, isTyping }) => {
    socket.to(`ticket:${ticketId}`).emit("ticket:typing", {
      ticketId,
      userId: user.userId,
      role: user.roleName,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("ticket:mark-read", async ({ ticketId }, cb) => {
    const ticket = await canAccessTicket(user, ticketId);
    if (!ticket) {
      cb?.({ ok: false, message: "Forbidden" });
      return;
    }
    try {
      const result = await ticketMessageService.markMessagesAsRead(
        ticketId,
        user.userId,
        user.roleName
      );
      socket.to(`ticket:${ticketId}`).emit("ticket:messages-read", {
        ticketId,
        userId: user.userId,
        timestamp: new Date(),
      });
      cb?.({ ok: true, data: result });
    } catch (err) {
      cb?.({ ok: false, message: err.message });
    }
  });

  socket.on("disconnect", () => {
    const ticketId = socket.data.ticketId;
    if (ticketId) {
      socket.to(`ticket:${ticketId}`).emit("ticket:presence", {
        ticketId,
        userId: user.userId,
        role: user.roleName,
        online: false,
      });
    }
  });
};