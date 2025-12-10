import { CONFIG } from "../config";

/**
 * WebSocketService for real-time driver updates.
 * Manages connection, reconnection, and event dispatching.
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.isExplicitlyDisconnected = false;
  }

  /**
   * Normalize the HTTP Base URL to a WS URL.
   * e.g., http://192.168.1.5:8000 -> ws://192.168.1.5:8000/ws/driver/updates/
   */
  getWebSocketUrl(token) {
    const wsUrl = CONFIG.WS_URL;
    // Append token as query parameter
    // URL in config already includes path: /ws/driver/updates/
    return `${wsUrl}?token=${token}`;
  }

  /**
   * Connect to the WebSocket server
   * @param {string} token - Auth token
   */
  connect(token) {
    if (!token) {
      console.warn("[WebSocketService] No token provided for connection");
      return;
    }

    // If already connected with same token, do nothing
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && this.token === token) {
      return;
    }

    this.token = token;
    this.isExplicitlyDisconnected = false;
    const url = this.getWebSocketUrl(token);

    console.log(`[WebSocketService] Connecting to: ${url}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[WebSocketService] Connected");
        this.reconnectAttempts = 0;
        this.emit("connection_status", { status: "connected" });
      };

      this.ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("[WebSocketService] Received:", event.type);
          this.emit(event.type, event);
        } catch (err) {
          console.error("[WebSocketService] Failed to parse message", err);
        }
      };

      this.ws.onerror = (e) => {
        console.log("[WebSocketService] Error:", e.message);
        this.emit("connection_status", { status: "error", error: e.message });
      };

      this.ws.onclose = (e) => {
        console.log(`[WebSocketService] Closed (Code: ${e.code})`);
        this.emit("connection_status", { status: "disconnected" });
        this.handleReconnection();
      };
    } catch (error) {
      console.error("[WebSocketService] Connection failed", error);
      this.handleReconnection();
    }
  }

  handleReconnection() {
    if (this.isExplicitlyDisconnected) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const timeout = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts); // Exponential backoff
      this.reconnectAttempts++;
      console.log(`[WebSocketService] Reconnecting in ${timeout}ms (Attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isExplicitlyDisconnected && this.token) {
          this.connect(this.token);
        }
      }, timeout);
    } else {
      console.warn("[WebSocketService] Max reconnection attempts reached");
    }
  }

  disconnect() {
    this.isExplicitlyDisconnected = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WebSocketService] Error in listener for ${event}:`, err);
        }
      });
    }
  }
}

export default new WebSocketService();
