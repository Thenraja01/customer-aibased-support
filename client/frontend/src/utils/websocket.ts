type MessageHandler = (data: any) => void;
type StatusHandler = (connected: boolean) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private isConnected = false;

  connect(url: string, token: string): void {
    this.url = url;
    this.token = token;
    this.createConnection();
  }

  private createConnection(): void {
    if (this.ws) this.ws.close();
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyStatus(true);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.notifyStatus(false);
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.isConnected = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
          handlers.forEach((handler) => handler(payload));
        }
      } catch {
        // ignore parse errors
      }
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    setTimeout(() => this.createConnection(), this.reconnectDelay);
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  send(type: string, payload: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);
    return () => this.messageHandlers.get(event)?.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private notifyStatus(connected: boolean): void {
    this.statusHandlers.forEach((handler) => handler(connected));
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const wsManager = new WebSocketManager();
