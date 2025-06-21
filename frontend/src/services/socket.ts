import { io, Socket } from"socket.io-client";

// Define event types for better type safety
export type SocketEvent =
 |"order:created"
 |"order:updated"
 |"order:status"
 |"order:item:status"
 |"table:status"
 |"payment:created"
 |"payment:status"
 |"stock:updated"
 |"stock:low"
 |"notification:new"
 |"notification:broadcast"
 |"campaign:created"
 |"campaign:updated"
 |"campaign:status"
 |"tenant:updated";

class SocketService {
 private socket: Socket | null = null;
 private listeners: Map<string, Set<Function>> = new Map();
 private reconnectAttempts = 0;
 private maxReconnectAttempts = 5;
 private reconnectInterval = 3000; // 3 seconds
 private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
 private connectionStatus:
  |"connected"
  |"disconnected"
  |"connecting"
  |"error" = "disconnected";
 private statusListeners: Set<(status: string) => void> = new Set();

 connect(userId?: string, tenantId?: string) {
  if (this.connectionStatus ==="connecting") {
   return this.socket;
  }

  if (!this.socket) {
   this.connectionStatus ="connecting";
   this.notifyStatusListeners();

   this.socket = io("/", {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: this.maxReconnectAttempts,
    reconnectionDelay: this.reconnectInterval,
    timeout: 10000,
    auth: {
     userId,
     tenantId,
    },
   });

   this.socket.on("connect", () => {
    console.log("Socket connected");
    this.reconnectAttempts = 0;
    this.connectionStatus ="connected";
    this.notifyStatusListeners();
   });

   this.socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    this.connectionStatus ="disconnected";
    this.notifyStatusListeners();

    // If the server disconnected us, try to reconnect manually
    if (reason ==="io server disconnect") {
     this.reconnect(userId, tenantId);
    }
   });

   this.socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    this.connectionStatus ="error";
    this.notifyStatusListeners();

    // Try to reconnect manually with backoff
    this.reconnect(userId, tenantId);
   });

   this.socket.on("error", (error) => {
    console.error("Socket error:", error);
    this.connectionStatus ="error";
    this.notifyStatusListeners();
   });

   // Set up event listeners
   this.setupEventListeners();
  } else if (userId && tenantId) {
   // Update auth if socket already exists but user/tenant changed
   this.socket.auth = { userId, tenantId };
   if (this.socket.connected) {
    // Reconnect to apply new auth
    this.socket.disconnect().connect();
   }
  }
  return this.socket;
 }

 // Manual reconnection with exponential backoff
 private reconnect(userId?: string, tenantId?: string) {
  if (this.reconnectTimer) {
   clearTimeout(this.reconnectTimer);
  }

  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
   console.log("Max reconnection attempts reached");
   return;
  }

  const delay = Math.min(
   this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
   30000 // Max 30 seconds
  );

  this.reconnectAttempts++;
  console.log(
   `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
  );

  this.reconnectTimer = setTimeout(() => {
   if (this.socket) {
    this.socket.connect();
   } else {
    this.connect(userId, tenantId);
   }
  }, delay);
 }

 disconnect() {
  if (this.reconnectTimer) {
   clearTimeout(this.reconnectTimer);
   this.reconnectTimer = null;
  }

  if (this.socket) {
   this.socket.disconnect();
   this.socket = null;
   this.connectionStatus ="disconnected";
   this.notifyStatusListeners();
  }
 }

 // Subscribe to connection status changes
 onStatusChange(callback: (status: string) => void) {
  this.statusListeners.add(callback);
  // Immediately notify with current status
  callback(this.connectionStatus);
  return () => this.statusListeners.delete(callback);
 }

 private notifyStatusListeners() {
  this.statusListeners.forEach((listener) => {
   try {
    listener(this.connectionStatus);
   } catch (error) {
    console.error("Error in socket status listener:", error);
   }
  });
 }

 private setupEventListeners() {
  if (!this.socket) return;

  // Define all events to listen for
  const events: SocketEvent[] = [
   // Order events
  "order:created",
  "order:updated",
  "order:status",
  "order:item:status",

   // Table events
  "table:status",

   // Payment events
  "payment:created",
  "payment:status",

   // Stock events
  "stock:updated",
  "stock:low",

   // Notification events
  "notification:new",
  "notification:broadcast",

   // Campaign events
  "campaign:created",
  "campaign:updated",
  "campaign:status",

   // Tenant events
  "tenant:updated",
  ];

  // Remove any existing listeners first to prevent duplicates
  this.removeAllEventListeners();

  // Set up listeners for all events
  events.forEach((event) => {
   this.socket?.on(event, (data) => {
    try {
     this.notifyListeners(event, data);
    } catch (error) {
     console.error(`Error handling socket event ${event}:`, error);
    }
   });
  });
 }

 // Remove all socket event listeners
 private removeAllEventListeners() {
  if (!this.socket) return;

  const events: SocketEvent[] = [
  "order:created",
  "order:updated",
  "order:status",
  "order:item:status",
  "table:status",
  "payment:created",
  "payment:status",
  "stock:updated",
  "stock:low",
  "notification:new",
  "notification:broadcast",
  "campaign:created",
  "campaign:updated",
  "campaign:status",
  "tenant:updated",
  ];

  events.forEach((event) => {
   this.socket?.removeAllListeners(event);
  });
 }

 // Register a callback for a specific event
 on(event: string, callback: Function) {
  if (!this.listeners.has(event)) {
   this.listeners.set(event, new Set());
  }
  this.listeners.get(event)?.add(callback);

  // If we're adding a listener but socket isn't connected, try to connect
  if (this.socket === null || !this.socket.connected) {
   this.connect();
  }

  return () => this.off(event, callback); // Return unsubscribe function
 }

 // Remove a callback for a specific event
 off(event: string, callback: Function) {
  if (this.listeners.has(event)) {
   this.listeners.get(event)?.delete(callback);

   // If this event has no more listeners, clean up
   if (this.listeners.get(event)?.size === 0) {
    this.listeners.delete(event);
   }
  }
 }

 // Notify all listeners for a specific event
 private notifyListeners(event: string, data: any) {
  if (this.listeners.has(event)) {
   this.listeners.get(event)?.forEach((callback) => {
    try {
     callback(data);
    } catch (error) {
     console.error(`Error in socket event listener for ${event}:`, error);
    }
   });
  }
 }

 // Get current connection status
 getStatus() {
  return this.connectionStatus;
 }

 // Check if socket is connected
 isConnected() {
  return this.socket?.connected || false;
 }
}

export const socketService = new SocketService();
export default socketService;
