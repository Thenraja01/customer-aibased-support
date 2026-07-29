import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addNotification } from "@/store/notificationSlice";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { onForegroundMessage } from "@/config/firebase";

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
  const dispatch = useDispatch();
  const { user, token } = useAuthContext();
  const toast = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?._id || !token) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("notification", (notif) => {
      dispatch(addNotification(notif));
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
      socket.disconnect();
      socketRef.current = null;
      if (unsubscribeFcm) unsubscribeFcm();
    };
  }, [user?._id, token, dispatch]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
