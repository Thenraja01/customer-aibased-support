import * as ticketService from "./ticket.service.js";
import * as ticketMessageService from "./ticketMessage.service.js";
import * as notifService from "../notification/notification.service.js";

export const create = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const ticket = await ticketService.createTicket(req.body, orgId);

    const supportUserIds = await ticketService.getSupportUserIds(orgId);
    if (supportUserIds.length > 0) {
      await notifService.broadcastNotification({
        title: "New ticket created",
        message: `${req.user?.name || "A customer"} created "${ticket.subject}"`,
        type: "info",
        link: `/support/tickets/${ticket._id}`,
      }, supportUserIds);
    }

    if (ticket.assigned_to) {
      await notifService.createNotification({
        user_id: ticket.assigned_to._id || ticket.assigned_to,
        title: "Ticket assigned to you",
        message: `You have been assigned "${ticket.subject}" via round-robin`,
        type: "info",
        link: `/support/tickets/${ticket._id}`,
      });
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const tickets = await ticketService.getAllTickets(isSuperAdmin ? null : orgId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const stats = await ticketService.getTicketStats(isSuperAdmin ? null : orgId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const tickets = await ticketService.getTicketsByUser(req.params.userId, orgId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBySupport = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const tickets = await ticketService.getTicketsBySupport(req.params.supportId, orgId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const tickets = await ticketService.getTicketsByStatus(req.params.status, orgId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assign = async (req, res) => {
  try {
    const ticket = await ticketService.assignTicket(req.params.id, req.body.supportId);

    // Notify the assigned agent
    await notifService.createNotification({
      user_id: req.body.supportId,
      title: "Ticket assigned to you",
      message: `Ticket "${ticket.subject}" has been assigned to you`,
      type: "info",
      link: `/support/tickets/${req.params.id}`,
    });

    // Notify the ticket creator
    if (ticket.user_id && ticket.user_id.toString() !== req.body.supportId) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Your ticket has been assigned",
        message: `Your ticket "${ticket.subject}" has been assigned to a support agent`,
        type: "info",
        link: `/tickets/${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: ticket });
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
    const ticket = await ticketService.resolveTicket(req.params.id, req.user.userId);

    // Notify the ticket creator
    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Ticket resolved",
        message: `Your ticket "${ticket.subject}" has been resolved`,
        type: "success",
        link: `/tickets/${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const close = async (req, res) => {
  try {
    const ticket = await ticketService.closeTicket(req.params.id, req.user.userId);

    // Notify the ticket creator
    if (ticket.user_id) {
      await notifService.createNotification({
        user_id: ticket.user_id,
        title: "Ticket closed",
        message: `Your ticket "${ticket.subject}" has been closed`,
        type: "info",
        link: `/tickets/${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const setInProgress = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketStatus(req.params.id, "in_progress");
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

export const reopen = async (req, res) => {
  try {
    const ticket = await ticketService.reopenTicket(req.params.id);

    // Notify assigned agent if any
    if (ticket.assigned_to) {
      await notifService.createNotification({
        user_id: ticket.assigned_to,
        title: "Ticket reopened",
        message: `Ticket "${ticket.subject}" has been reopened`,
        type: "warning",
        link: `/support/tickets/${req.params.id}`,
      });
    }

    res.status(200).json({ success: true, data: ticket });
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

export const getMessages = async (req, res) => {
  try {
    const roleName = req.user?.roleName?.toLowerCase();
    const includeInternal = ["super_admin", "admin", "support"].includes(roleName);
    const messages = await ticketMessageService.getMessagesByTicket(req.params.ticketId, includeInternal);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const ticketCheck = await ticketService.getTicketById(req.params.ticketId);
    if (ticketCheck.status === "closed" || ticketCheck.status === "resolved") {
      return res.status(400).json({ success: false, message: `Cannot send messages on a ${ticketCheck.status} ticket.` });
    }

    const msg = await ticketMessageService.createMessage({
      ticket_id: req.params.ticketId,
      sender_id: req.user.userId,
      content: req.body.content,
      attachments: req.body.attachments || [],
      is_internal: req.body.is_internal || false,
    });

    if (!req.body.is_internal) {
      const ticket = await ticketService.getTicketById(req.params.ticketId);
      const isCustomer = ticket.user_id?._id?.toString() === req.user.userId;

      if (isCustomer) {
        await ticketService.updateTicketStatus(req.params.ticketId, "in_progress");
      } else {
        await ticketService.updateTicketStatus(req.params.ticketId, "waiting_for_customer");
        await notifService.createNotification({
          user_id: ticket.user_id._id,
          title: "New reply on your ticket",
          message: `${req.user.name || "Support"} replied to "${ticket.subject}"`,
          type: "info",
          link: `/tickets/${req.params.ticketId}`,
        });
      }
    }

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    const orgId = req.user.organizationId;
    const ticket = await ticketService.escalateFromChat({
      chatId,
      subject: subject || "Escalated from AI Chat",
      description,
      userId: req.user.userId,
      organizationId: orgId,
    });

    if (ticket.assigned_to) {
      await notifService.createNotification({
        user_id: ticket.assigned_to._id || ticket.assigned_to,
        title: "Ticket assigned to you",
        message: `You have been assigned "${ticket.subject}" via round-robin`,
        type: "info",
        link: `/support/tickets/${ticket._id}`,
      });
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getQueue = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const queue = await ticketService.getQueue(orgId);
    const workload = await ticketService.getAgentWorkload(orgId);
    res.json({ success: true, data: { queue, workload } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const smartAssignTicket = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    const result = await ticketService.smartAssign(req.params.ticketId, orgId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
