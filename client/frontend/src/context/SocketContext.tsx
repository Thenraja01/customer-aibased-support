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
      "http://localhost:5000"
    ).replace(/\/+$/, "");
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
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

    socket.on("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount", currentUserId] });
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
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      if (unsubscribeFcm) unsubscribeFcm();
    };
  }, [user?._id, token, queryClient, toast]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
