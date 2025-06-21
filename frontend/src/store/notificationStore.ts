import { create } from"zustand";
import { devtools } from"zustand/middleware";
import {
 NotificationType,
 NotificationPriority,
 NotificationStatus,
} from"../types/notification";
import api from"../services/api";
import socketService from"../services/socket";

export interface Notification {
 id: string;
 type: NotificationType;
 title: string;
 message: string;
 link?: string;
 priority: NotificationPriority;
 status: NotificationStatus;
 isRead: boolean;
 readAt?: Date;
 isArchived: boolean;
 archivedAt?: Date;
 expiresAt?: Date;
 metadata?: Record<string, any>;
 recipientId: string;
 senderId?: string;
 tenantId?: string;
 createdAt: Date;
 updatedAt: Date;
}

interface NotificationState {
 notifications: Notification[];
 unreadCount: number;
 isLoading: boolean;
 error: string | null;

 // Actions
 fetchNotifications: () => Promise<void>;
 fetchUnreadNotifications: () => Promise<void>;
 markAsRead: (id: string) => Promise<void>;
 markAllAsRead: () => Promise<void>;
 archiveNotification: (id: string) => Promise<void>;
 addNotification: (notification: Notification) => void;
 clearError: () => void;
 setupSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>()(
 devtools(
  (set, get) => ({
   notifications: [],
   unreadCount: 0,
   isLoading: false,
   error: null,

   fetchNotifications: async () => {
    try {
     set({ isLoading: true, error: null });
     const response = await api.get("/notifications");
     set({
      notifications: response.data,
      unreadCount: response.data.filter((n: Notification) => !n.isRead)
       .length,
      isLoading: false,
     });
    } catch (error) {
     console.error("Failed to fetch notifications:", error);
     set({
      error:"Failed to fetch notifications. Please try again.",
      isLoading: false,
     });
    }
   },

   fetchUnreadNotifications: async () => {
    try {
     set({ isLoading: true, error: null });
     const response = await api.get("/notifications/unread");
     set({
      notifications: response.data,
      unreadCount: response.data.length,
      isLoading: false,
     });
    } catch (error) {
     console.error("Failed to fetch unread notifications:", error);
     set({
      error:"Failed to fetch unread notifications. Please try again.",
      isLoading: false,
     });
    }
   },

   markAsRead: async (id: string) => {
    try {
     set({ isLoading: true, error: null });
     await api.patch(`/notifications/${id}/read`);

     // Update local state
     set((state) => {
      const updatedNotifications = state.notifications.map(
       (notification) =>
        notification.id === id
         ? {
           ...notification,
           isRead: true,
           status:"read" as NotificationStatus,
          }
         : notification
      );

      return {
       notifications: updatedNotifications,
       unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
       isLoading: false,
      };
     });
    } catch (error) {
     console.error("Failed to mark notification as read:", error);
     set({
      error:"Failed to mark notification as read. Please try again.",
      isLoading: false,
     });
    }
   },

   markAllAsRead: async () => {
    try {
     set({ isLoading: true, error: null });
     await api.post("/notifications/read-all");

     // Update local state
     set((state) => ({
      notifications: state.notifications.map((notification) => ({
       ...notification,
       isRead: true,
       status:"read" as NotificationStatus,
      })),
      unreadCount: 0,
      isLoading: false,
     }));
    } catch (error) {
     console.error("Failed to mark all notifications as read:", error);
     set({
      error:
      "Failed to mark all notifications as read. Please try again.",
      isLoading: false,
     });
    }
   },

   archiveNotification: async (id: string) => {
    try {
     set({ isLoading: true, error: null });
     await api.patch(`/notifications/${id}/archive`);

     // Update local state
     set((state) => {
      const updatedNotifications = state.notifications.filter(
       (notification) => notification.id !== id
      );

      const archivedNotification = state.notifications.find(
       (notification) => notification.id === id
      );

      return {
       notifications: updatedNotifications,
       unreadCount:
        archivedNotification && !archivedNotification.isRead
         ? state.unreadCount - 1
         : state.unreadCount,
       isLoading: false,
      };
     });
    } catch (error) {
     console.error("Failed to archive notification:", error);
     set({
      error:"Failed to archive notification. Please try again.",
      isLoading: false,
     });
    }
   },

   addNotification: (notification: Notification) => {
    set((state) => ({
     notifications: [notification, ...state.notifications],
     unreadCount: state.unreadCount + 1,
    }));
   },

   clearError: () => set({ error: null }),

   setupSocketListeners: () => {
    // Listen for new notifications
    socketService.on("notification:new", (notification: Notification) => {
     get().addNotification(notification);
    });

    // Listen for broadcast notifications
    socketService.on(
    "notification:broadcast",
     (notification: Notification) => {
      get().addNotification(notification);
     }
    );
   },
  }),
  { name:"notification-store" }
 )
);
