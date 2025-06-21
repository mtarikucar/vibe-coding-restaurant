import React, { useState, useEffect } from 'react';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { 
 usePushNotifications, 
 isPushNotificationSupported, 
 getNotificationPermission,
 isPushNotificationSubscribed
} from '../../services/pushNotificationService';

interface NotificationPermissionProps {
 className?: string;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ className = '' }) => {
 const { t } = useTranslation();
 const [permission, setPermission] = useState<NotificationPermission>('default');
 const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
 const [isSupported, setIsSupported] = useState<boolean>(false);
 const { requestPermission, unsubscribeFromPushNotifications } = usePushNotifications();

 useEffect(() => {
  const checkSupport = async () => {
   const supported = isPushNotificationSupported();
   setIsSupported(supported);
   
   if (supported) {
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);
    
    if (currentPermission === 'granted') {
     const subscribed = await isPushNotificationSubscribed();
     setIsSubscribed(subscribed);
    }
   }
  };
  
  checkSupport();
 }, []);

 const handleRequestPermission = async () => {
  const success = await requestPermission();
  if (success) {
   setPermission('granted');
   setIsSubscribed(true);
  }
 };

 const handleUnsubscribe = async () => {
  try {
   await unsubscribeFromPushNotifications();
   setIsSubscribed(false);
  } catch (error) {
   console.error('Failed to unsubscribe:', error);
  }
 };

 if (!isSupported) {
  return null;
 }

 return (
  <div className={`flex items-center ${className}`}>
   {permission === 'granted' && isSubscribed ? (
    <button
     onClick={handleUnsubscribe}
     className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
     title={t('notifications.unsubscribe')}
    >
     <BellIcon className="h-5 w-5 text-green-500" />
     <span>{t('notifications.enabled')}</span>
    </button>
   ) : (
    <button
     onClick={handleRequestPermission}
     className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
     title={t('notifications.subscribe')}
    >
     <BellSlashIcon className="h-5 w-5 text-gray-400" />
     <span>{t('notifications.disabled')}</span>
    </button>
   )}
  </div>
 );
};

export default NotificationPermission;
