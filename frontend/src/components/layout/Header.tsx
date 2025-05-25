import { useState } from "react";
import { Link } from "react-router-dom";
import { Bars3Icon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../notifications/NotificationBell";
import SocketStatus from "../common/SocketStatus";
import useAuthStore from "../../store/authStore";

const Header = () => {
  const { t } = useTranslation();

  const { user } = useAuthStore();

  return (
    <header className="bg-neutral-100 dark:bg-darkGray-800 shadow-sm border-b border-neutral-300 dark:border-darkGray-700">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-primary-600 hover:text-primary-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-darkGray-700"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-primary-700 dark:text-neutral-200 ml-2">
            {t("dashboard.title")}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <SocketStatus showLabel={false} className="mr-2" />

          {(user?.role === "waiter" || user?.role === "admin") && (
            <Link
              to="/mobile-redirect"
              className="flex items-center text-primary-600 hover:text-primary-700 transition-colors bg-neutral-200 hover:bg-neutral-300 p-2 rounded-xl dark:bg-darkGray-700 dark:hover:bg-darkGray-600 dark:text-primary-400"
              title={t("navigation.mobileApp")}
            >
              <DevicePhoneMobileIcon className="h-5 w-5" />
              <span className="ml-1 text-sm hidden lg:inline">
                {t("navigation.mobileApp")}
              </span>
            </Link>
          )}
          <div className="bg-neutral-200 dark:bg-darkGray-700 p-1 rounded-xl">
            <LanguageSelector />
          </div>
          <div className="bg-neutral-200 dark:bg-darkGray-700 p-1 rounded-xl">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
