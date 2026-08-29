import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addNotification } from "@/store/notificationSlice";
import { useAuthContext } from "@/context/AuthContext";

export function useSocket() {
  const dispatch = useDispatch();
  const { user, token } = useAuthContext();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?._id || !token) return;

    const socketUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3030").replace(/\/+$/, "");
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("notification", (notif) => {
      dispatch(addNotification(notif));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, token, dispatch]);

  return socketRef;
}
