import mongoose from "mongoose";
import Chat from "./chat.schema.js";
import Message from "../message/message.schema.js";
import User from "../user/user.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import { getIO } from "../../config/socket.js";
import { createNotification } from "../notification/notification.service.js";

export const handoffChatToAgent = async ({ chatId, userId, organizationId, branchId, reason = "user_requested" }) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat session not found");

  // Multi-tenant Org check
  if (chat.organization_id && organizationId && chat.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Chat session belongs to another organization");
  }

  // Find available support agent for this organization and branch
  const agentQuery = {
    organization_id: organizationId || chat.organization_id,
    role: { $in: ["support", "branch_admin", "admin"] },
    status: "active",
  };
  if (branchId || chat.branch_id) {
    agentQuery.$or = [
      { branch_id: branchId || chat.branch_id },
      { branch_id: null },
    ];
  }

  const availableAgent = await User.findOne(agentQuery).select("_id name email role branch_id").lean();

  // Update chat state to escalated/assigned
  chat.is_escalated = true;
  chat.escalated_at = new Date();
  chat.status = "escalated";
  if (availableAgent) {
    chat.assigned_to = availableAgent._id;
  }
  await chat.save();

  // Append system message in chat history marking the handoff
  const handoffNoticeText = availableAgent
    ? `Support request initiated. You are being connected with Support Agent ${availableAgent.name}.`
    : `Support request initiated. A live support agent will be connected shortly.`;

  const systemMsg = await Message.create({
    chat_id: chatId,
    sender_id: userId || null,
    content: handoffNoticeText,
    message_type: "system",
    is_ai: true,
  });

  // Emit Socket.io real-time events to client and assigned agent
  try {
    const io = getIO();
    const eventPayload = {
      chatId: chat._id,
      status: "escalated",
      assignedAgent: availableAgent || null,
      message: systemMsg,
      timestamp: new Date().toISOString(),
    };

    io.to(`chat:${chatId}`).emit("chat:transferred", eventPayload);
    if (availableAgent) {
      io.to(`user:${availableAgent._id}`).emit("agent:assigned_chat", eventPayload);
    }
  } catch (err) {
    console.warn("[ChatHandoff] Socket.io broadcast notice:", err.message);
  }

  // Send in-app notification to assigned agent or branch support team
  if (availableAgent) {
    await createNotification({
      user_id: availableAgent._id,
      organization_id: organizationId || chat.organization_id,
      title: "Live Chat Transfer Request",
      message: `A customer requested live support assistance in Chat #${chatId.toString().slice(-6)}.`,
      type: "warning",
      link: `/support/chats/${chatId}`,
    }).catch(() => null);
  }

  return {
    success: true,
    chat,
    assignedAgent: availableAgent || null,
    message: handoffNoticeText,
  };
};
