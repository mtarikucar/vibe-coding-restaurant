import { useState } from "react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../common/LanguageSelector";

const Header = () => {
  const { t } = useTranslation();

  const [notifications] = useState([
    { id: 1, message: "New order received", time: "5 min ago" },
    { id: 2, message: "Table 5 requested service", time: "10 min ago" },
    { id: 3, message: "Kitchen completed order #1234", time: "15 min ago" },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white shadow">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800 ml-2">
            {t("dashboard.title")}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <div className="relative">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div className="font-medium">{t("common.notifications")}</div>
                </div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-gray-100 transition duration-150 ease-in-out"
                  >
                    <p className="text-sm text-gray-700">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                ))}
                <div className="px-4 py-2 text-xs text-center text-blue-600 border-t border-gray-200 hover:text-blue-800">
                  {t("common.viewAllNotifications")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
