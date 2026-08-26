import * as ticketService from "./ticket.service.js";
import * as ticketMessageService from "./ticketMessage.service.js";
import * as notifService from "../notification/notification.service.js";
import Branch from "../branch/branch.schema.js";
import {
  sendTicketMessageWorkflow,
  emitToTicketRoom,
  isStaffRole,
} from "./ticketWorkflow.service.js";

const roleNameOf = (req) => {
  const r = req.user?.roleName || req.user?.role || (Array.isArray(req.user?.roles) && req.user.roles[0]) || req.scope?.role || "";
  return String(r).toLowerCase();
};

export const create = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id || req.body.organization_id;
    let branchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id || req.body.branch_id || null;

    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required to create a ticket" });
    }

    if (!branchId && orgId) {
      try {
        const defaultBranch = await Branch.findOne({ organization_id: orgId }).select("_id").lean();
        if (defaultBranch) branchId = defaultBranch._id?.toString();
      } catch {
        /* proceed with null branchId */
      }
    }

    const userId = req.scope?.isCustomer
      ? (req.user?.userId || req.user?._id)
      : (req.body.user_id || req.user?.userId || req.user?._id);

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required to create a ticket" });
    }

    let category = req.body.category || "other";
    if (category === "general") category = "question";
    if (category === "technical") category = "technical_issue";

    const ticket = await ticketService.createTicket(
      {
        ...req.body,
        category,
        user_id: userId,
        organization_id: orgId,
        branch_id: branchId,
        source: req.body.source || (req.scope?.isCustomer ? "customer" : "api"),
      },
      orgId,
      branchId
    );

    const supportUserIds = await ticketService.getSupportUserIds(orgId, branchId);
    if (supportUserIds.length > 0) {
      await notifService.broadcastNotification({
        title: "New ticket created",
        message: `${req.user?.name || "A customer"} created "#${ticket.ticket_number}"`,
        type: "info",
        link: `/support/tickets/${ticket._id}`,
        organization_id: orgId,
      }, supportUserIds);
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    let tickets;
    if (req.scope?.isCustomer) {
      tickets = await ticketService.getTicketsByUser(req.user.userId || req.user._id);
    } else {
      const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
      const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
      tickets = await ticketService.getAllTickets(orgId, branchId);
    }
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const stats = await ticketService.getTicketStats(orgId, branchId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);

    // Customers may only view their own tickets.
    if (req.scope?.isCustomer && ticket.user_id?._id?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByNumber = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const ticket = await ticketService.getTicketByNumber(req.params.ticketNumber, orgId);
    if (req.scope?.isCustomer && ticket.user_id?._id?.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const tickets = await ticketService.getTicketsByUser(req.params.userId, orgId, branchId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBySupport = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const tickets = await ticketService.getTicketsBySupport(req.params.supportId, orgId, branchId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
    const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const tickets = await ticketService.getTicketsByStatus(req.params.status, orgId, branchId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assign = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);
    const assigned = await ticketService.assignTicket(req.params.id, req.body.supportId);

    await notifService.createNotification({
      user_id: req.body.supportId,
      title: "Ticket assigned to you",
      message: `Ticket "#${ticket.ticket_number}" has been assigned to you`,
      type: "info",
      link: `/support/tickets/${req.params.id}`,
    });

    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Your ticket has been assigned",
        message: `Your ticket "#${ticket.ticket_number}" has been assigned to a support agent`,
        type: "info",
        link: `/tickets/${req.params.id}`,
      });
    }

    emitToTicketRoom(req.params.id, "ticket:assigned", { ticketId: req.params.id, agentId: req.body.supportId });

    res.status(200).json({ success: true, data: assigned });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePriority = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketPriority(req.params.id, req.body.priority);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolve = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);
    const resolved = await ticketService.resolveTicket(req.params.id, req.user.userId);

    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Ticket resolved",
        message: `Your ticket "#${ticket.ticket_number}" has been resolved`,
        type: "success",
        link: `/tickets/${req.params.id}`,
      });
    }

    emitToTicketRoom(req.params.id, "ticket:resolved", { ticketId: req.params.id });

    res.status(200).json({ success: true, data: resolved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const close = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const ticket = await assertTicketAccess(req, req.params.id);
    const closed = await ticketService.closeTicket(req.params.id, userId, req.body?.reason || null);

    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Ticket closed",
        message: `Your ticket "#${ticket.ticket_number}" has been closed`,
        type: "info",
        link: `/tickets/${req.params.id}`,
      });
    }

    emitToTicketRoom(req.params.id, "ticket:closed", { ticketId: req.params.id });

    res.status(200).json({ success: true, data: closed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const setInProgress = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketStatus(req.params.id, "in_progress");
    emitToTicketRoom(req.params.id, "ticket:status", { ticketId: req.params.id, status: "in_progress" });
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const setPending = async (req, res) => {
  try {
    const ticket = await ticketService.setTicketPending(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const escalate = async (req, res) => {
  try {
    const { reason, target } = req.body;
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);
    const escalated = await ticketService.escalateTicket(req.params.id, {
      escalatedBy: req.user.userId,
      reason,
      target: target || "support",
    });

    emitToTicketRoom(req.params.id, "ticket:escalated", { ticketId: req.params.id, reason });

    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Ticket escalated",
        message: `Your ticket "#${ticket.ticket_number}" has been escalated to our senior team`,
        type: "warning",
        link: `/tickets/${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: escalated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const takeover = async (req, res) => {
  try {
    const adminUserId = req.user.userId || req.user._id;
    const ticket = await ticketService.takeoverTicket(req.params.id, adminUserId, req.body?.note || "Branch Admin Takeover");

    emitToTicketRoom(req.params.id, "ticket:assigned", { ticketId: req.params.id, agentId: adminUserId });

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectEscalation = async (req, res) => {
  try {
    const { comment } = req.body;
    const ticket = await ticketService.updateTicketStatus(req.params.id, "in_progress");

    if (comment) {
      await ticketMessageService.createMessage({
        ticket_id: req.params.id,
        sender_id: req.user.userId || req.user._id,
        content: `[Internal Escalation Rejected] ${comment}`,
        is_internal: true,
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancel = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);
    const cancelled = await ticketService.cancelTicket(req.params.id, req.user.userId, req.body?.reason);

    emitToTicketRoom(req.params.id, "ticket:cancelled", { ticketId: req.params.id });

    res.status(200).json({ success: true, data: cancelled });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reopen = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const ticket = await ticketService.getTicketById(req.params.id, orgId, branchId);
    const result = await ticketService.reopenTicket(req.params.id);

    if (result.action === "requires_new") {
      return res.status(400).json({
        success: false,
        message: "Reopening window expired. Create a new ticket to continue.",
        requires_new_ticket: true,
        previous_ticket: result.ticket,
      });
    }

    const reopened = result.ticket;
    if (reopened.assigned_to) {
      await notifService.createNotification({
        user_id: reopened.assigned_to,
        title: "Ticket reopened",
        message: `Ticket "#${ticket.ticket_number}" has been reopened`,
        type: "warning",
        link: `/support/tickets/${req.params.id}`,
      });
    }

    emitToTicketRoom(req.params.id, "ticket:reopened", { ticketId: req.params.id });

    res.status(200).json({ success: true, data: reopened });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await ticketService.deleteTicket(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const assertTicketAccess = async (req, ticketId) => {
  const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
  const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
  const ticket = await ticketService.getTicketById(ticketId, orgId, branchId);
  if (req.scope?.isCustomer && ticket.user_id?._id?.toString() !== req.user.userId) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  return ticket;
};

export const getMessages = async (req, res) => {
  try {
    await assertTicketAccess(req, req.params.ticketId);
    const roleName = roleNameOf(req);
    const includeInternal = isStaffRole(roleName);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const result = await ticketMessageService.getMessagesPaginated(req.params.ticketId, {
      page,
      limit,
      includeInternal,
    });
    res.status(200).json({
      success: true,
      data: result.items || [],
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const ticket = await assertTicketAccess(req, req.params.ticketId);
    const roleName = roleNameOf(req);
    const msg = await sendTicketMessageWorkflow({
      ticket,
      senderUserId: req.user.userId,
      senderRole: roleName,
      senderName: req.user.name,
      content: req.body.content,
      attachments: req.body.attachments || [],
      isInternal: req.body.is_internal,
    });
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    const status = error.statusCode || 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const ticket = await assertTicketAccess(req, req.params.ticketId);
    const roleName = roleNameOf(req);
    const result = await ticketMessageService.markMessagesAsRead(req.params.ticketId, req.user.userId, roleName);
    emitToTicketRoom(req.params.ticketId, "ticket:messages-read", {
      ticketId: req.params.ticketId,
      userId: req.user.userId,
      timestamp: new Date(),
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const roleName = roleNameOf(req);
    const data = await ticketMessageService.getUnreadCountsByUser(req.user.userId, roleName);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const result = await ticketMessageService.deleteMessage(req.params.messageId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const escalateFromChat = async (req, res) => {
  try {
    const { chatId, subject, description } = req.body;
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.branchId;
    const ticket = await ticketService.escalateFromChat({
      chatId,
      subject: subject || "Escalated from AI Chat",
      description,
      userId: req.user.userId,
      organizationId: orgId,
      branchId: branchId,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Convert AI / Support Mini Chat into a formal Support Ticket (Idempotent)
 * POST /tickets/convert-from-chat
 */
export const convertFromChat = async (req, res) => {
  try {
    const { chatId, subject, description, category = "question", priority = "medium", source = "AI -> Human Support -> Ticket" } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, message: "chatId is required" });
    }

    const Chat = (await import("../chat/chat.schema.js")).default;
    const Message = (await import("../message/message.schema.js")).default;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Idempotency: Return existing ticket if already converted
    if (chat.ticket_id) {
      const existingTicket = await ticketService.getTicketById(chat.ticket_id);
      if (existingTicket) {
        return res.status(200).json({ success: true, data: existingTicket, alreadyConverted: true });
      }
    }

    const messages = await Message.find({ chat_id: chatId }).sort({ created_at: 1 }).lean();
    const transcript = messages
      .map((m) => `[${m.is_ai ? "AI" : "User"}]: ${m.content}`)
      .join("\n");

    const orgId = chat.organization_id || req.scope?.organizationId;
    const branchId = chat.branch_id || req.scope?.branchId;
    const userId = chat.user_id || req.user?.userId || req.user?._id;

    const ticketTitle = subject || chat.topic || `Issue: ${messages[0]?.content?.substring(0, 50) || "Chat Escalation"}`;
    const ticketDesc = description || `Conversation transcript:\n\n${transcript}`;

    const ticket = await ticketService.createTicket(
      {
        user_id: userId,
        organization_id: orgId,
        branch_id: branchId,
        conversation_id: chatId,
        subject: ticketTitle,
        description: ticketDesc,
        category,
        priority,
        source,
        escalated_from_chat: {
          chat_id: chatId,
          conversation_preview: transcript.substring(0, 2000),
        },
      },
      orgId,
      branchId
    );

    // Link ticket to chat and update chat status to CONVERTED_TO_TICKET
    chat.ticket_id = ticket._id;
    chat.status = "CONVERTED_TO_TICKET";
    await chat.save();

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getWorkload = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const workload = await ticketService.getAgentWorkload(orgId, branchId);
    res.json({ success: true, data: workload });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQueue = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const queue = await ticketService.getQueue(orgId, branchId);
    const workload = await ticketService.getAgentWorkload(orgId, branchId);
    res.json({ success: true, data: { queue, workload } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const smartAssignTicket = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const result = await ticketService.smartAssign(req.params.ticketId, orgId);
    if (result.assignedTo) {
      await notifService.createNotification({
        user_id: result.assignedTo._id,
        title: "Ticket assigned to you",
        message: `Ticket has been assigned to you`,
        type: "info",
        link: `/support/tickets/${req.params.ticketId}`,
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEscalated = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organization_id;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const tickets = await ticketService.getTickets(
      {
        $or: [
          { status: "escalated" },
          { sla_status: "breached" },
          { is_escalated: true },
        ],
      },
      orgId,
      branchId
    );
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateTicketSummary = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await assertTicketAccess(req, ticketId);
    const Message = (await import("../message/message.schema.js")).default;
    const messages = await Message.find({ ticket_id: ticketId }).sort({ created_at: 1 }).lean();

    const threadText = messages
      .map((m) => `[${m.sender_type || "User"}]: ${m.body || m.content || ""}`)
      .join("\n");

    const prompt = `You are a Customer Support AI Assistant. Summarize this customer support ticket thread concisely for support agents.

Ticket Number: ${ticket.ticket_number}
Category: ${ticket.category}
Priority: ${ticket.priority}
Status: ${ticket.status}
Subject: ${ticket.subject || ticket.title}
Description: ${ticket.description || ""}

Conversation Thread:
${threadText || "No messages exchange yet."}

Provide a structured response:
1. Executive Summary (2-3 sentences)
2. Key Points
3. Recommended Next Actions`;

    const { generateResponse } = await import("../llm/index.js");
    const llmRes = await generateResponse(prompt, "Summarize ticket", {
      provider: "ollama",
      organizationId: ticket.organization_id,
    });

    const summaryText = llmRes?.text || "Summary could not be generated.";
    res.json({
      success: true,
      data: {
        ticket_id: ticketId,
        summary: summaryText,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAiIntelligence = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await assertTicketAccess(req, ticketId);
    const TicketAiIntelligence = (await import("./ticketAiIntelligence.schema.js")).default;
    
    let intel = await TicketAiIntelligence.findOne({ ticket_id: ticket._id }).lean();
    if (!intel) {
      const { runTicketAiPipeline } = await import("./services/ticketAiOrchestrator.service.js");
      intel = await runTicketAiPipeline(ticket._id, req.app?.get("io"));
    }
    res.json({ success: true, data: intel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerAiAnalysis = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await assertTicketAccess(req, ticketId);
    const { runTicketAiPipeline } = await import("./services/ticketAiOrchestrator.service.js");
    
    const intel = await runTicketAiPipeline(ticket._id, req.app?.get("io"));
    res.json({ success: true, data: intel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyAiPriority = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await assertTicketAccess(req, ticketId);
    const TicketAiIntelligence = (await import("./ticketAiIntelligence.schema.js")).default;
    
    const intel = await TicketAiIntelligence.findOne({ ticket_id: ticket._id });
    if (!intel?.recommended_priority) {
      return res.status(400).json({ success: false, message: "No recommended priority available" });
    }

    const updatedTicket = await ticketService.updateTicketPriority(ticket._id, intel.recommended_priority);
    res.json({ success: true, data: updatedTicket, message: `Updated priority to ${intel.recommended_priority.toUpperCase()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAiFeedback = async (req, res) => {
  try {
    const ticketId = req.params.id;
    await assertTicketAccess(req, ticketId);
    const { recordAiFeedback } = await import("./services/aiEvaluationService.service.js");
    
    const { status, agentEdits, rating } = req.body;
    const updated = await recordAiFeedback(ticketId, { status, agentEdits, rating });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAiAnalytics = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId;
    const { getAiTicketAnalytics } = await import("./services/aiEvaluationService.service.js");
    
    const stats = await getAiTicketAnalytics(orgId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};