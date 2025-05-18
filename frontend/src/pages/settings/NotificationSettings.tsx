import React, { useEffect } from "react";
import {
  NotificationType,
  NotificationChannel,
  type NotificationPreference,
} from "../../types/notification";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNotificationPreferenceStore } from "../../store/notificationPreferenceStore";

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreference,
    createDefaultPreferences,
  } = useNotificationPreferenceStore();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const getNotificationTypeName = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.SYSTEM:
        return t("notifications.types.system");
      case NotificationType.ORDER:
        return t("notifications.types.order");
      case NotificationType.KITCHEN:
        return t("notifications.types.kitchen");
      case NotificationType.PAYMENT:
        return t("notifications.types.payment");
      case NotificationType.STOCK:
        return t("notifications.types.stock");
      case NotificationType.USER:
        return t("notifications.types.user");
      case NotificationType.CAMPAIGN:
        return t("notifications.types.campaign");
      case NotificationType.SUBSCRIPTION:
        return t("notifications.types.subscription");
      default:
        return type;
    }
  };

  const getChannelName = (channel: NotificationChannel): string => {
    switch (channel) {
      case NotificationChannel.IN_APP:
        return t("notifications.channels.inApp");
      case NotificationChannel.EMAIL:
        return t("notifications.channels.email");
      case NotificationChannel.PUSH:
        return t("notifications.channels.push");
      case NotificationChannel.SMS:
        return t("notifications.channels.sms");
      default:
        return channel;
    }
  };

  // Group preferences by notification type
  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.notificationType]) {
      acc[pref.notificationType] = [];
    }
    acc[pref.notificationType].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("notifications.settings")}
        </h1>
        {preferences.length === 0 && !isLoading && (
          <button
            onClick={createDefaultPreferences}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t("notifications.createDefaultPreferences")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : preferences.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">{t("notifications.noPreferences")}</p>
          <p className="text-gray-600 mt-2">
            {t("notifications.createDefaultMessage")}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
            <div className="px-6 py-3 col-span-2">
              {t("notifications.notificationType")}
            </div>
            <div className="px-6 py-3">{t("notifications.channel")}</div>
            <div className="px-6 py-3 col-span-2">
              {t("notifications.status")}
            </div>
          </div>

          {Object.entries(groupedPreferences).map(([type, prefs]) => (
            <React.Fragment key={type}>
              <div className="col-span-5 bg-gray-100 px-6 py-2 font-medium text-gray-800">
                {getNotificationTypeName(type as NotificationType)}
              </div>
              {prefs.map((pref) => (
                <div
                  key={pref.id}
                  className="grid grid-cols-5 border-b border-gray-200"
                >
                  <div className="px-6 py-4 col-span-2"></div>
                  <div className="px-6 py-4">
                    {getChannelName(pref.channel)}
                  </div>
                  <div className="px-6 py-4 col-span-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={pref.enabled}
                        onChange={(e) =>
                          updatePreference(pref.id, e.target.checked)
                        }
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700">
                        {pref.enabled
                          ? t("notifications.enabled")
                          : t("notifications.disabled")}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
