import api from './api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Check if the browser supports push notifications
export const isPushNotificationSupported = (): boolean => {
 return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request permission for push notifications
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
 if (!isPushNotificationSupported()) {
  throw new Error('Push notifications are not supported in this browser');
 }

 try {
  const permission = await Notification.requestPermission();
  return permission;
 } catch (error) {
  console.error('Error requesting notification permission:', error);
  throw error;
 }
};

// Get the current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
 if (!isPushNotificationSupported()) {
  return 'denied';
 }
 return Notification.permission;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
 if (!isPushNotificationSupported()) {
  console.warn('Push notifications are not supported in this browser');
  return null;
 }

 try {
  // Request permission first
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
   console.warn('Notification permission not granted');
   return null;
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;
  
  // Get the server's public key
  const response = await api.get('/notifications/vapid-public-key');
  const vapidPublicKey = response.data.publicKey;
  
  // Convert the public key to Uint8Array
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  
  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
   userVisibleOnly: true,
   applicationServerKey: convertedVapidKey
  });
  
  // Send the subscription to the server
  await api.post('/notifications/subscriptions', {
   subscription: JSON.stringify(subscription)
  });
  
  return subscription;
 } catch (error) {
  console.error('Error subscribing to push notifications:', error);
  throw error;
 }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
 if (!isPushNotificationSupported()) {
  return false;
 }

 try {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
   return true; // Already unsubscribed
  }
  
  // Unsubscribe from push manager
  const success = await subscription.unsubscribe();
  
  if (success) {
   // Notify the server
   await api.delete('/notifications/subscriptions', {
    data: { subscription: JSON.stringify(subscription) }
   });
  }
  
  return success;
 } catch (error) {
  console.error('Error unsubscribing from push notifications:', error);
  throw error;
 }
};

// Check if the user is subscribed to push notifications
export const isPushNotificationSubscribed = async (): Promise<boolean> => {
 if (!isPushNotificationSupported()) {
  return false;
 }

 try {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
 } catch (error) {
  console.error('Error checking push notification subscription:', error);
  return false;
 }
};

// Helper function to convert base64 to Uint8Array
// This is needed for the applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
 const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
 const base64 = (base64String + padding)
  .replace(/-/g, '+')
  .replace(/_/g, '/');

 const rawData = window.atob(base64);
 const outputArray = new Uint8Array(rawData.length);

 for (let i = 0; i < rawData.length; ++i) {
  outputArray[i] = rawData.charCodeAt(i);
 }
 return outputArray;
}

// Hook for managing push notification permissions with translations
export const usePushNotifications = () => {
 const { t } = useTranslation();

 const requestPermission = async (): Promise<boolean> => {
  try {
   const permission = await requestNotificationPermission();
   if (permission === 'granted') {
    toast.success(t('notifications.permissionGranted'));
    await subscribeToPushNotifications();
    return true;
   } else {
    toast.error(t('notifications.permissionDenied'));
    return false;
   }
  } catch (error) {
   console.error('Error in requestPermission:', error);
   toast.error(t('notifications.permissionError'));
   return false;
  }
 };

 return {
  requestPermission,
  isPushNotificationSupported,
  getNotificationPermission,
  isPushNotificationSubscribed,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
 };
};
