import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (!this.socket) {
      this.socket = io('/', {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Set up event listeners
      this.setupEventListeners();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Order events
    this.socket.on('order:created', (data) => this.notifyListeners('order:created', data));
    this.socket.on('order:updated', (data) => this.notifyListeners('order:updated', data));
    this.socket.on('order:status', (data) => this.notifyListeners('order:status', data));
    this.socket.on('order:item:status', (data) => this.notifyListeners('order:item:status', data));

    // Table events
    this.socket.on('table:status', (data) => this.notifyListeners('table:status', data));

    // Payment events
    this.socket.on('payment:created', (data) => this.notifyListeners('payment:created', data));
    this.socket.on('payment:status', (data) => this.notifyListeners('payment:status', data));

    // Stock events
    this.socket.on('stock:updated', (data) => this.notifyListeners('stock:updated', data));
    this.socket.on('stock:low', (data) => this.notifyListeners('stock:low', data));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
  }

  private notifyListeners(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach((callback) => {
        callback(data);
      });
    }
  }
}

export const socketService = new SocketService();
export default socketService;
