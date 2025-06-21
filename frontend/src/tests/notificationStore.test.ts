import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useNotificationStore } from '../store/notificationStore';
import api from '../services/api';
import socketService from '../services/socket';

// Mock the API service
vi.mock('../services/api', () => ({
 default: {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
 },
}));

// Mock the socket service
vi.mock('../services/socket', () => ({
 default: {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
 },
}));

// Mock notification data
const mockNotifications = [
 {
  id: 'notification-1',
  title: 'New Order',
  message: 'Order #123 has been placed',
  type: 'order',
  isRead: false,
  createdAt: '2023-06-15T10:30:00Z',
 },
 {
  id: 'notification-2',
  title: 'Order Ready',
  message: 'Order #456 is ready for pickup',
  type: 'kitchen',
  isRead: true,
  createdAt: '2023-06-15T11:00:00Z',
 },
 {
  id: 'notification-3',
  title: 'Payment Received',
  message: 'Payment for Order #789 has been received',
  type: 'payment',
  isRead: false,
  createdAt: '2023-06-15T11:30:00Z',
 },
];

describe('Notification Store', () => {
 beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset the store
  useNotificationStore.setState({
   notifications: [],
   unreadCount: 0,
   isLoading: false,
   error: null,
  });
  
  // Mock API responses
  (api.get as any).mockImplementation((url) => {
   if (url === '/notifications') {
    return Promise.resolve({ data: mockNotifications });
   }
   return Promise.reject(new Error('Not found'));
  });
  
  (api.patch as any).mockImplementation((url) => {
   if (url.includes('/notifications/')) {
    return Promise.resolve({ data: { success: true } });
   }
   return Promise.reject(new Error('Not found'));
  });
  
  (api.post as any).mockImplementation((url) => {
   if (url === '/notifications/read-all') {
    return Promise.resolve({ data: { success: true } });
   }
   return Promise.reject(new Error('Not found'));
  });
 });

 afterEach(() => {
  vi.resetAllMocks();
 });

 it('should initialize with default values', () => {
  const state = useNotificationStore.getState();
  expect(state.notifications).toEqual([]);
  expect(state.unreadCount).toBe(0);
  expect(state.isLoading).toBe(false);
  expect(state.error).toBeNull();
 });

 it('should fetch notifications', async () => {
  const { fetchNotifications } = useNotificationStore.getState();
  
  await fetchNotifications();
  
  const state = useNotificationStore.getState();
  expect(api.get).toHaveBeenCalledWith('/notifications');
  expect(state.notifications).toEqual(mockNotifications);
  expect(state.unreadCount).toBe(2); // Two unread notifications
  expect(state.isLoading).toBe(false);
  expect(state.error).toBeNull();
 });

 it('should mark a notification as read', async () => {
  // First fetch notifications
  const { fetchNotifications, markAsRead } = useNotificationStore.getState();
  await fetchNotifications();
  
  // Then mark one as read
  await markAsRead('notification-1');
  
  const state = useNotificationStore.getState();
  expect(api.patch).toHaveBeenCalledWith('/notifications/notification-1/read');
  
  // Check that the notification is marked as read in the store
  const updatedNotification = state.notifications.find(n => n.id === 'notification-1');
  expect(updatedNotification?.isRead).toBe(true);
  
  // Check that the unread count is decremented
  expect(state.unreadCount).toBe(1);
 });

 it('should mark all notifications as read', async () => {
  // First fetch notifications
  const { fetchNotifications, markAllAsRead } = useNotificationStore.getState();
  await fetchNotifications();
  
  // Then mark all as read
  await markAllAsRead();
  
  const state = useNotificationStore.getState();
  expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
  
  // Check that all notifications are marked as read in the store
  expect(state.notifications.every(n => n.isRead)).toBe(true);
  
  // Check that the unread count is zero
  expect(state.unreadCount).toBe(0);
 });

 it('should archive a notification', async () => {
  // First fetch notifications
  const { fetchNotifications, archiveNotification } = useNotificationStore.getState();
  await fetchNotifications();
  
  // Then archive one
  await archiveNotification('notification-2');
  
  const state = useNotificationStore.getState();
  expect(api.delete).toHaveBeenCalledWith('/notifications/notification-2');
  
  // Check that the notification is removed from the store
  expect(state.notifications.find(n => n.id === 'notification-2')).toBeUndefined();
  expect(state.notifications.length).toBe(2);
 });

 it('should add a new notification', () => {
  const { addNotification } = useNotificationStore.getState();
  
  const newNotification = {
   id: 'notification-4',
   title: 'Stock Alert',
   message: 'Chicken is running low',
   type: 'stock',
   isRead: false,
   createdAt: '2023-06-15T12:00:00Z',
  };
  
  addNotification(newNotification);
  
  const state = useNotificationStore.getState();
  expect(state.notifications[0]).toEqual(newNotification); // Should be at the beginning
  expect(state.unreadCount).toBe(1);
 });

 it('should set up socket listeners', () => {
  const { setupSocketListeners } = useNotificationStore.getState();
  
  setupSocketListeners();
  
  expect(socketService.on).toHaveBeenCalledWith('notification:new', expect.any(Function));
  expect(socketService.on).toHaveBeenCalledWith('notification:broadcast', expect.any(Function));
  
  // Simulate receiving a new notification
  const newNotificationHandler = (socketService.on as any).mock.calls.find(
   call => call[0] === 'notification:new'
  )[1];
  
  const newNotification = {
   id: 'notification-4',
   title: 'Stock Alert',
   message: 'Chicken is running low',
   type: 'stock',
   isRead: false,
   createdAt: '2023-06-15T12:00:00Z',
  };
  
  newNotificationHandler(newNotification);
  
  const state = useNotificationStore.getState();
  expect(state.notifications[0]).toEqual(newNotification);
  expect(state.unreadCount).toBe(1);
 });

 it('should handle errors when fetching notifications', async () => {
  // Mock API to throw an error
  (api.get as any).mockRejectedValue(new Error('Network error'));
  
  const { fetchNotifications } = useNotificationStore.getState();
  
  await fetchNotifications();
  
  const state = useNotificationStore.getState();
  expect(state.error).toBe('Failed to fetch notifications. Please try again.');
  expect(state.isLoading).toBe(false);
 });

 it('should clear errors', () => {
  // Set an error
  useNotificationStore.setState({ error: 'Test error' });
  
  const { clearError } = useNotificationStore.getState();
  
  clearError();
  
  const state = useNotificationStore.getState();
  expect(state.error).toBeNull();
 });
});
