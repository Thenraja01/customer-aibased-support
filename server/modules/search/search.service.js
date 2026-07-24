import Faq from "../faq/faq.schema.js";
import Document from "../document/document.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import Chat from "../chat/chat.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

const searchFaqs = async (query, organizationId, filters) => {
  const match = {};
  if (organizationId) match.organization_id = organizationId;
  if (filters.category) match.category = filters.category;
  if (filters.status) match.status = filters.status;

  if (query) {
    const safe = escapeRegex(query);
    match.$or = [
      { question: { $regex: safe, $options: "i" } },
      { answer: { $regex: safe, $options: "i" } },
    ];
  }

  return await Faq.find(match)
    .populate("created_by", "name email")
    .populate("approved_by", "name email")
    .sort({ created_at: -1 })
    .limit(filters.limit)
    .lean();
};

const searchDocuments = async (query, organizationId, filters) => {
  const match = {};
  if (organizationId) match.organization_id = organizationId;
  if (filters.status) match.status = filters.status;

  if (query) {
    const safe = escapeRegex(query);
    match.$or = [
      { title: { $regex: safe, $options: "i" } },
      { file_name: { $regex: safe, $options: "i" } },
    ];
  }

  return await Document.find(match)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .sort({ created_at: -1 })
    .limit(filters.limit)
    .lean();
};

const searchTickets = async (query, organizationId, filters) => {
  const match = {};
  if (organizationId) match.organization_id = organizationId;
  if (filters.status) match.status = filters.status;
  if (filters.category) match.category = filters.category;
  if (filters.userId) match.user_id = filters.userId;

  if (query) {
    const safe = escapeRegex(query);
    match.$or = [
      { subject: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    match.created_at = {};
    if (filters.dateFrom) match.created_at.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) match.created_at.$lte = new Date(filters.dateTo);
  }

  return await Ticket.find(match)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 })
    .limit(filters.limit)
    .lean();
};

const searchChats = async (query, organizationId, filters) => {
  const match = {};
  if (organizationId) match.organization_id = organizationId;
  if (filters.status) match.status = filters.status;
  if (filters.userId) match.user_id = filters.userId;

  if (query) {
    const safe = escapeRegex(query);
    match.topic = { $regex: safe, $options: "i" };
  }

  if (filters.dateFrom || filters.dateTo) {
    match.created_at = {};
    if (filters.dateFrom) match.created_at.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) match.created_at.$lte = new Date(filters.dateTo);
  }

  return await Chat.find(match)
    .populate("user_id", "name email")
    .sort({ created_at: -1 })
    .limit(filters.limit)
    .lean();
};

export const search = async ({ query, type, organizationId, page, limit, ...filters }) => {
  const defaultLimit = limit || 20;
  const searchFilters = { ...filters, limit: defaultLimit };

  let faqs = [];
  let documents = [];
  let tickets = [];
  let chats = [];

  const searches = [];

  if (!type || type === "faq") {
    searches.push(
      searchFaqs(query, organizationId, searchFilters).then((r) => { faqs = r; })
    );
  }
  if (!type || type === "document") {
    searches.push(
      searchDocuments(query, organizationId, searchFilters).then((r) => { documents = r; })
    );
  }
  if (!type || type === "ticket") {
    searches.push(
      searchTickets(query, organizationId, searchFilters).then((r) => { tickets = r; })
    );
  }
  if (!type || type === "chat") {
    searches.push(
      searchChats(query, organizationId, searchFilters).then((r) => { chats = r; })
    );
  }

  await Promise.all(searches);

  return {
    data: {
      faqs: faqs.map((f) => ({ ...f, _type: "faq" })),
      documents: documents.map((d) => ({ ...d, _type: "document" })),
      tickets: tickets.map((t) => ({ ...t, _type: "ticket" })),
      chats: chats.map((c) => ({ ...c, _type: "chat" })),
    },
    total: faqs.length + documents.length + tickets.length + chats.length,
  };
};
