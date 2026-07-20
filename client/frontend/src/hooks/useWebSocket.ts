import { useEffect, useRef, useState, useCallback } from 'react';
import { tokenManager } from '@/utils/tokenManager';

interface WebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  } = options;

  const connect = useCallback(() => {
    const token = tokenManager.getAccessToken() || '';
    const wsUrl = `${url}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = (event) => {
      setIsConnected(true);
      reconnectCountRef.current = 0;
      onOpen?.(event);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      onClose?.(event);
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectCountRef.current++;
          connect();
        }, reconnectDelay);
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
      onMessage?.(event);
    };

    wsRef.current = ws;
  }, [url, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (data: string | object) => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      }
      return false;
    },
    [isConnected]
  );

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, sendMessage, lastMessage, disconnect, reconnect: connect };
}
