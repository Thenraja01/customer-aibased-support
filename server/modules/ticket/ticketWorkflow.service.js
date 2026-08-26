import * as ticketService from "./ticket.service.js";
import * as ticketMessageService from "./ticketMessage.service.js";
import { markFirstResponse } from "./sla.service.js";
import * as notifService from "../notification/notification.service.js";
import { getIO } from "../../config/socket.js";

const STAFF_ROLES = ["super_admin", "admin", "branch_admin", "support"];

export const ROLE_SENDER_TYPE = {
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  branch_admin: "BRANCH_ADMIN",
  support: "SUPPORT",
  customer: "CUSTOMER",
};

export const senderTypeFromRole = (role) => ROLE_SENDER_TYPE[(role || "").toLowerCase()] || "CUSTOMER";

export const isStaffRole = (role) => STAFF_ROLES.includes((role || "").toLowerCase());

export const emitToTicketRoom = (ticketId, event, payload) => {
  try {
    getIO().to(`ticket:${ticketId}`).emit(event, payload);
  } catch {
    // socket not initialized — persistence is unaffected
  }
};

/**
 * Shared send-message workflow used by both the REST controller and the
 * Socket.IO handler so the two paths never diverge.
 *
 * Persist first (MongoDB is the source of truth), then update ticket state,
 * then notify, then broadcast in real time.
 */
export const sendTicketMessageWorkflow = async ({
  ticket,
  senderUserId,
  senderRole,
  senderName = "Support",
  content,
  attachments = [],
  isInternal = false,
}) => {
  const roleName = (senderRole || "").toLowerCase();
  const isStaff = isStaffRole(roleName);
  const senderType = senderTypeFromRole(roleName);
  const internal = Boolean(isInternal) && isStaff;

  if (["closed", "cancelled", "resolved"].includes(ticket.status)) {
    ticket.status = isStaff ? "waiting_for_customer" : "in_progress";
    await ticket.save();
  }

  const msg = await ticketMessageService.createMessage({
    ticket_id: ticket._id,
    organization_id: ticket.organization_id,
    branch_id: ticket.branch_id,
    sender_id: senderUserId,
    sender_type: senderType,
    content,
    attachments,
    is_internal: internal,
  });

  if (isStaff && !internal) {
    await markFirstResponse(ticket._id).catch(() => {});
    await ticketService.updateTicketStatus(ticket._id, "waiting_for_customer");
    if (ticket.user_id && ticket.user_id._id?.toString() !== senderUserId) {
      await notifService.createNotification({
        user_id: ticket.user_id._id,
        title: "New reply on your ticket",
        message: `${senderName} replied to "#${ticket.ticket_number}"`,
        type: "info",
        link: `/tickets/${ticket._id}`,
      });
    }
  } else {
    await ticketService.updateTicketStatus(ticket._id, "in_progress");
  }

  emitToTicketRoom(ticket._id, "ticket:new-message", msg);

  // Auto-regenerate Copilot intelligence and suggested response with the new conversation context
  import("./services/ticketAiOrchestrator.service.js")
    .then(({ runTicketAiPipeline }) => {
      runTicketAiPipeline(ticket._id, getIO()).catch((err) => {
        console.warn("[TicketWorkflow] Background AI re-analysis warning:", err.message);
      });
    })
    .catch(() => {});

  return msg;
};