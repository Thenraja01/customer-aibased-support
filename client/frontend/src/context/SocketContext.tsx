import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { onForegroundMessage } from "@/config/firebase";
import { useFreshToken } from "@/hooks/useFreshToken";

interface SocketContextValue {
  socket: Socket | null;
  typingUsers: Record<string, boolean>;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  typingUsers: {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const toast = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  // Read the live token from storage so a rotated access token triggers a
  // clean reconnect instead of a permanently rejected socket handshake.
  const token = useFreshToken();

  useEffect(() => {
    const currentUserId = user?._id || user?.userId;
    if (!currentUserId || !token) return;

    const socketUrl = (
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:3030"
    ).replace(/\/+$/, "");
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (import.meta.env.DEV) console.debug("[Socket] Connected");
    });

    // Handle transient connect failures (e.g. server restarting) without
    // spamming the console with unhandled errors — socket.io retries anyway.
    socket.on("connect_error", (err) => {
      if (import.meta.env.DEV) console.debug("[Socket] Connect error:", err.message);
    });

    socket.on("notification", (data: any) => {
      const title = data?.title || "New Notification";
      const body = data?.message || data?.content || "You have a new update.";
      toast.info(title, body);
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount", currentUserId] });
    });

    socket.on("ticket:created", (data: any) => {
      toast.info("New Ticket Created", `Ticket #${data?.ticketNumber || data?.ticketId || ""} was created.`);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    });

    socket.on("ticket:assigned", (data: any) => {
      toast.info("Ticket Assigned", data?.message || "A ticket has been assigned.");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    });

    socket.on("ticket:message", (data: any) => {
      const senderId = typeof data?.sender_id === "object" ? data?.sender_id?._id : data?.sender_id;
      if (senderId !== currentUserId) {
        toast.info("New Ticket Message", data?.content?.slice(0, 90) || "New response received on ticket.");
      }
    });

    socket.on("ticket:status", (data: any) => {
      toast.info("Ticket Status Updated", `Status updated to ${data?.status || "changed"}.`);
    });

    socket.on("agent:assigned_chat", (data: any) => {
      toast.warning("Live Support Request", `Customer requested live support assistance in Chat #${(data?.chatId || "").toString().slice(-6)}.`);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["activeChats"] });
    });

    socket.on("chat:transferred", (data: any) => {
      if (data?.assignedAgent) {
        toast.success("Support Agent Joined", `Support Agent ${data.assignedAgent.name} joined the chat.`);
      } else {
        toast.info("Escalation Requested", "Live support request initiated.");
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["activeChats"] });
    });

    socket.on("chat:message", (data: any) => {
      if (data?.chat_id) {
        queryClient.invalidateQueries({ queryKey: ["messages", data.chat_id] });
      }
    });

    socket.on("document:indexed", (data: any) => {
      toast.success(
        "Document Indexed",
        `Document "${data?.title || "File"}" (${data?.chunkCount || 0} chunks) is live in RAG search.`
      );
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (data?.documentId) {
        queryClient.invalidateQueries({ queryKey: ["document", data.documentId] });
      }
      queryClient.invalidateQueries({ queryKey: ["ragMetrics"] });
    });

    socket.on("typing:start", ({ chatId, userId: typingUserId }) => {
      if (typingUserId !== user._id) {
        setTypingUsers((prev) => ({ ...prev, [`${chatId}:${typingUserId}`]: true }));
      }
    });

    socket.on("typing:stop", ({ chatId, userId: typingUserId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[`${chatId}:${typingUserId}`];
        return next;
      });
    });

    const unsubscribeFcm = onForegroundMessage((payload: any) => {
      if (payload?.notification) {
        toast.info(
          payload.notification.title || "New Notification",
          payload.notification.body || ""
        );
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      if (unsubscribeFcm) unsubscribeFcm();
    };
  }, [user?._id, token, queryClient, toast]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
