import Document from "../document/document.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import Chat from "../chat/chat.schema.js";
import User from "../user/user.schema.js";
import Message from "../message/message.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const globalSearch = async ({ query, type, organizationId, userId, roleName, page = 1, limit = 20 }) => {
  const safe = escapeRegex(query);
  const skip = (page - 1) * limit;
  const results = {};
  const promises = [];

  if (!type || type === "all" || type === "documents") {
    promises.push(
      (async () => {
        const docFilter = {
          is_deleted: { $ne: true },
          organization_id: organizationId,
          $or: [
            { title: { $regex: safe, $options: "i" } },
            { description: { $regex: safe, $options: "i" } },
            { tags: { $regex: safe, $options: "i" } },
          ],
        };
        if (roleName === "customer") docFilter.user_id = userId;
        const [data, total] = await Promise.all([
          Document.find(docFilter).select("-file_data").skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
          Document.countDocuments(docFilter),
        ]);
        results.documents = { data, total };
      })()
    );
  }

  if (!type || type === "all" || type === "tickets") {
    promises.push(
      (async () => {
        const ticketFilter = {
          is_deleted: { $ne: true },
          organization_id: organizationId,
          $or: [
            { subject: { $regex: safe, $options: "i" } },
            { description: { $regex: safe, $options: "i" } },
            { tags: { $regex: safe, $options: "i" } },
          ],
        };
        if (roleName === "customer") ticketFilter.user_id = userId;
        const [data, total] = await Promise.all([
          Ticket.find(ticketFilter)
            .populate("user_id", "name email")
            .populate("assigned_to", "name email")
            .skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
          Ticket.countDocuments(ticketFilter),
        ]);
        results.tickets = { data, total };
      })()
    );
  }

  if ((!type || type === "all" || type === "chats") && (roleName === "admin" || roleName === "super_admin" || roleName === "support")) {
    promises.push(
      (async () => {
        const chatFilter = {
          is_deleted: { $ne: true },
          organization_id: organizationId,
          topic: { $regex: safe, $options: "i" },
        };
        const [data, total] = await Promise.all([
          Chat.find(chatFilter)
            .populate("user_id", "name email")
            .skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
          Chat.countDocuments(chatFilter),
        ]);
        results.chats = { data, total };
      })()
    );
  }

  if ((!type || type === "all" || type === "messages") && (roleName === "admin" || roleName === "super_admin" || roleName === "support")) {
    promises.push(
      (async () => {
        const msgFilter = {
          content: { $regex: safe, $options: "i" },
        };
        const [data, total] = await Promise.all([
          Message.find(msgFilter)
            .populate("sender_id", "name email")
            .skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
          Message.countDocuments(msgFilter),
        ]);
        results.messages = { data, total };
      })()
    );
  }

  if ((!type || type === "all" || type === "users") && (roleName === "admin" || roleName === "super_admin")) {
    promises.push(
      (async () => {
        const userFilter = {
          is_deleted: { $ne: true },
          organization_id: organizationId,
          $or: [
            { name: { $regex: safe, $options: "i" } },
            { email: { $regex: safe, $options: "i" } },
          ],
        };
        const [data, total] = await Promise.all([
          User.find(userFilter).select("-password").skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
          User.countDocuments(userFilter),
        ]);
        results.users = { data, total };
      })()
    );
  }

  await Promise.all(promises);

  let totalCount = 0;
  for (const key of Object.keys(results)) {
    totalCount += results[key].total;
  }

  return { results, total: totalCount, page, limit };
};

export const searchDocuments = async ({ query, organizationId, userId, roleName, page = 1, limit = 20 }) => {
  return globalSearch({ query, type: "documents", organizationId, userId, roleName, page, limit });
};

export const searchTickets = async ({ query, organizationId, userId, roleName, page = 1, limit = 20 }) => {
  return globalSearch({ query, type: "tickets", organizationId, userId, roleName, page, limit });
};

export const searchChats = async ({ query, organizationId, page = 1, limit = 20 }) => {
  const safe = escapeRegex(query);
  const skip = (page - 1) * limit;
  const chatFilter = {
    is_deleted: { $ne: true },
    organization_id: organizationId,
    topic: { $regex: safe, $options: "i" },
  };
  const [data, total] = await Promise.all([
    Chat.find(chatFilter).populate("user_id", "name email").skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
    Chat.countDocuments(chatFilter),
  ]);
  return { data, total, page, limit };
};

export const searchUsers = async ({ query, organizationId, page = 1, limit = 20 }) => {
  const safe = escapeRegex(query);
  const skip = (page - 1) * limit;
  const userFilter = {
    is_deleted: { $ne: true },
    organization_id: organizationId,
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ],
  };
  const [data, total] = await Promise.all([
    User.find(userFilter).select("-password").skip(skip).limit(limit).sort({ created_at: -1 }).lean(),
    User.countDocuments(userFilter),
  ]);
  return { data, total, page, limit };
};
