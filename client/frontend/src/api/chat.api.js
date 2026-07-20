import AxiosInstance from "./axiosInstance.js";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export const ChatAPI = {
  create: (data) => AxiosInstance.post("/chats", data),
  getAll: (params) => AxiosInstance.get("/chats", { params }),
  getActive: () => AxiosInstance.get("/chats/active"),
  getById: (id) => AxiosInstance.get(`/chats/${id}`),
  getByUser: (userId) => AxiosInstance.get(`/chats/user/${userId}`),
  getUserCount: (userId) => AxiosInstance.get(`/chats/user/${userId}/count`),
  search: (params) => AxiosInstance.get("/chats/search", { params }),
  updateTopic: (id, data) => AxiosInstance.patch(`/chats/${id}/topic`, data),
  close: (id) => AxiosInstance.patch(`/chats/${id}/close`),
  reopen: (id) => AxiosInstance.patch(`/chats/${id}/reopen`),
  delete: (id) => AxiosInstance.delete(`/chats/${id}`),
  escalate: (id, data) => AxiosInstance.post(`/chats/${id}/escalate`, data),
  sendAI: (chatId, message) =>
    AxiosInstance.post("/chats/ai", { chatId, message }),
  streamAI: async (chatId, message, onToken, onDone, onError) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${BASE_URL}/chats/${chatId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        onError(errData?.message || `Stream request failed with status ${response.status}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              onDone({ type: "done" });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token") {
                onToken(parsed.content);
              } else if (parsed.type === "done") {
                onDone(parsed.meta || {});
              } else if (parsed.type === "error") {
                onError(parsed.message);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      onError(err.message || "Stream connection failed");
    }
  },
};
