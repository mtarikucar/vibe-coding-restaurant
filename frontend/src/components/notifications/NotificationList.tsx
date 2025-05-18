import React from "react";
import { Link } from "react-router-dom";
import {
  useNotificationStore,
  type Notification,
} from "../../store/notificationStore";
import { formatDistanceToNow } from "date-fns";
import {
  BellIcon,
  ShoppingCartIcon,
  FireIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  UserIcon,
  TagIcon,
  CreditCardIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { NotificationType } from "../../types/notification";

interface NotificationListProps {
  notifications: Notification[];
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onClose,
}) => {
  const { markAsRead, archiveNotification } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
      case NotificationType.ORDER:
        return <ShoppingCartIcon className="h-5 w-5 text-blue-500" />;
      case NotificationType.KITCHEN:
        return <FireIcon className="h-5 w-5 text-orange-500" />;
      case NotificationType.PAYMENT:
        return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
      case NotificationType.STOCK:
        return <ArchiveBoxIcon className="h-5 w-5 text-red-500" />;
      case NotificationType.USER:
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case NotificationType.CAMPAIGN:
        return <TagIcon className="h-5 w-5 text-yellow-500" />;
      case NotificationType.SUBSCRIPTION:
        return <CreditCardIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      onClose();
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    await archiveNotification(id);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    await markAsRead(id);
  };

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-gray-500">
        <BellIcon className="h-8 w-8 mx-auto text-gray-400" />
        <p className="mt-2">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
            !notification.isRead ? "bg-blue-50" : ""
          }`}
        >
          {notification.link ? (
            <Link
              to={notification.link}
              className="block"
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationItem
                notification={notification}
                icon={getIcon(notification.type)}
                onArchive={handleArchive}
                onMarkAsRead={handleMarkAsRead}
              />
            </Link>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationItem
                notification={notification}
                icon={getIcon(notification.type)}
                onArchive={handleArchive}
                onMarkAsRead={handleMarkAsRead}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  icon: React.ReactNode;
  onArchive: (e: React.MouseEvent, id: string) => void;
  onMarkAsRead: (e: React.MouseEvent, id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  icon,
  onArchive,
  onMarkAsRead,
}) => {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="ml-3 flex-1">
        <div className="flex justify-between">
          <p
            className={`text-sm font-medium ${
              !notification.isRead ? "text-gray-900" : "text-gray-600"
            }`}
          >
            {notification.title}
          </p>
          <div className="flex space-x-1">
            {!notification.isRead && (
              <button
                onClick={(e) => onMarkAsRead(e, notification.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Mark as read"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => onArchive(e, notification.id)}
              className="text-gray-400 hover:text-gray-600"
              title="Archive"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
};

export default NotificationList;
