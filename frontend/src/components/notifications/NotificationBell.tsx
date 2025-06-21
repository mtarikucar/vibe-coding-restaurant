import React, { useEffect, useState, useRef } from"react";
import { BellIcon } from"@heroicons/react/24/outline";
import { useNotificationStore } from"../../store/notificationStore";
import useAuthStore from"../../store/authStore";
import NotificationList from"./NotificationList";
import NotificationPermission from"./NotificationPermission";
import socketService from"../../services/socket";
import { useTranslation } from"react-i18next";

const NotificationBell: React.FC = () => {
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);
 const {
  notifications,
  unreadCount,
  fetchNotifications,
  setupSocketListeners,
 } = useNotificationStore();
 const { user } = useAuthStore();
 const { t } = useTranslation();

 useEffect(() => {
  // Fetch notifications when component mounts
  fetchNotifications();

  // Setup socket listeners for real-time notifications
  setupSocketListeners();

  // Connect socket with user info
  if (user) {
   socketService.connect(user.id, user.tenantId);
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
   if (
    dropdownRef.current &&
    !dropdownRef.current.contains(event.target as Node)
   ) {
    setIsOpen(false);
   }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
   document.removeEventListener("mousedown", handleClickOutside);
  };
 }, [fetchNotifications, setupSocketListeners, user]);

 const toggleDropdown = () => {
  setIsOpen(!isOpen);
 };

 return (
  <div className="relative" ref={dropdownRef}>
   <button
    className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
    onClick={toggleDropdown}
    aria-label="Notifications"
   >
    <BellIcon className="h-6 w-6" />
    {unreadCount > 0 && (
     <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
      {unreadCount > 99 ?"99+" : unreadCount}
     </span>
    )}
   </button>

   {isOpen && (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
     <div className="py-2">
      <div className="px-4 py-2 border-b border-gray-200">
       <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
         {t("notifications.title","Notifications")}
        </h3>
        {unreadCount > 0 && (
         <button
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => {
           useNotificationStore.getState().markAllAsRead();
           setIsOpen(false);
          }}
         >
          {t("notifications.markAllAsRead","Mark all as read")}
         </button>
        )}
       </div>
      </div>
      <div className="px-4 py-2 border-b border-gray-200">
       <NotificationPermission className="w-full" />
      </div>
      <NotificationList
       notifications={notifications}
       onClose={() => setIsOpen(false)}
      />
     </div>
    </div>
   )}
  </div>
 );
};

export default NotificationBell;
