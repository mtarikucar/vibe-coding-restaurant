import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import socketService from '../services/socket';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Create a mock socket
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
  id: 'socket-id',
};

describe('Socket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset socket service state
    socketService.disconnect();
    
    // Mock socket connection status
    Object.defineProperty(mockSocket, 'connected', {
      get: vi.fn(() => false),
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should connect to the socket server', () => {
    socketService.connect('user-id', 'tenant-id');
    
    expect(io).toHaveBeenCalledWith('/', expect.objectContaining({
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        userId: 'user-id',
        tenantId: 'tenant-id',
      },
    }));
    
    // Simulate connection event
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectCallback();
    
    expect(socketService.getConnectionStatus()).toBe('connected');
  });

  it('should disconnect from the socket server', () => {
    // First connect
    socketService.connect();
    
    // Then disconnect
    socketService.disconnect();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should register event listeners', () => {
    const callback = vi.fn();
    
    // Register a listener
    socketService.on('test-event', callback);
    
    // Check that the socket.on method was called
    expect(mockSocket.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    
    // Simulate the event being triggered
    const eventCallback = mockSocket.on.mock.calls.find(call => call[0] === 'test-event')[1];
    const eventData = { message: 'Test message' };
    eventCallback(eventData);
    
    // Check that our callback was called with the event data
    expect(callback).toHaveBeenCalledWith(eventData);
  });

  it('should remove event listeners', () => {
    const callback = vi.fn();
    
    // Register a listener
    socketService.on('test-event', callback);
    
    // Remove the listener
    socketService.off('test-event', callback);
    
    // Check that the socket.off method was called
    expect(mockSocket.off).toHaveBeenCalledWith('test-event', expect.any(Function));
  });

  it('should emit events', () => {
    const eventData = { message: 'Test message' };
    
    // Emit an event
    socketService.emit('test-event', eventData);
    
    // Check that the socket.emit method was called
    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', eventData);
  });

  it('should handle connection errors', () => {
    socketService.connect();
    
    // Simulate error event
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    const error = new Error('Connection error');
    errorCallback(error);
    
    expect(socketService.getConnectionStatus()).toBe('error');
  });

  it('should handle disconnection', () => {
    socketService.connect();
    
    // Simulate connection
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectCallback();
    
    // Simulate disconnection
    const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    disconnectCallback('io client disconnect');
    
    expect(socketService.getConnectionStatus()).toBe('disconnected');
  });

  it('should notify status listeners when connection status changes', () => {
    const statusListener = vi.fn();
    
    // Register a status listener
    socketService.onStatusChange(statusListener);
    
    // Connect
    socketService.connect();
    
    // Simulate connection
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectCallback();
    
    // Check that the status listener was called
    expect(statusListener).toHaveBeenCalledWith('connected');
    
    // Simulate disconnection
    const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    disconnectCallback('io client disconnect');
    
    // Check that the status listener was called again
    expect(statusListener).toHaveBeenCalledWith('disconnected');
  });

  it('should attempt to reconnect on connection error', () => {
    vi.useFakeTimers();
    
    socketService.connect();
    
    // Simulate error event
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    const error = new Error('Connection error');
    errorCallback(error);
    
    // Fast-forward timer
    vi.advanceTimersByTime(3000);
    
    // Check that a reconnection attempt was made
    expect(io).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
  });

  it('should stop reconnection attempts after max attempts', () => {
    vi.useFakeTimers();
    
    socketService.connect();
    
    // Simulate multiple error events
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    const error = new Error('Connection error');
    
    // Simulate 6 failed connection attempts (1 initial + 5 retries)
    for (let i = 0; i < 6; i++) {
      errorCallback(error);
      vi.advanceTimersByTime(3000);
    }
    
    // Reset call count
    (io as any).mockClear();
    
    // One more error should not trigger another reconnection
    errorCallback(error);
    vi.advanceTimersByTime(3000);
    
    // Check that no more reconnection attempts were made
    expect(io).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});
