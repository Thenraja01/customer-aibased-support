import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socketInstance) {
    const socketUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3030").replace(/\/+$/, "");
    socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }

  if (token && !socketInstance.connected) {
    socketInstance.auth = { token };
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export default getSocket;
