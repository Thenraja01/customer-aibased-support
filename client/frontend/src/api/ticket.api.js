/**
 * Enhanced Ticket API
 * Covers full support agent workflow: status, comments, escalation, assignment
 */
import AxiosInstance from "./axiosInstance.js";

export const TicketAPI = {
  create:          (data)   => AxiosInstance.post("/tickets", data),
  getAll:          (params) => AxiosInstance.get("/tickets", { params }),
  getStats:        ()       => AxiosInstance.get("/tickets/stats"),
  getById:         (id)     => AxiosInstance.get(`/tickets/${id}`),
  getByUser:       (userId) => AxiosInstance.get(`/tickets/user/${userId}`),
  getByAgent:      (agentId)=> AxiosInstance.get(`/tickets/support/${agentId}`),
  getByStatus:     (status) => AxiosInstance.get(`/tickets/status/${status}`),

  // Status workflow
  updateStatus:    (id, status) => AxiosInstance.patch(`/tickets/${id}/status`, { status }),
  assign:          (id, data)   => AxiosInstance.patch(`/tickets/${id}/assign`, data),
  updatePriority:  (id, data)   => AxiosInstance.patch(`/tickets/${id}/priority`, data),
  resolve:         (id, data)   => AxiosInstance.patch(`/tickets/${id}/resolve`, data),
  close:           (id)         => AxiosInstance.patch(`/tickets/${id}/close`),
  escalate:        (id, reason) => AxiosInstance.post(`/tickets/${id}/escalate`, { reason }),

  // Comments (internal/external)
  getComments:     (ticketId)          => AxiosInstance.get(`/ticket-comments/ticket/${ticketId}`),
  addComment:      (ticketId, data)    => AxiosInstance.post(`/ticket-comments`, { ticket_id: ticketId, ...data }),

  delete:          (id) => AxiosInstance.delete(`/tickets/${id}`),
};
