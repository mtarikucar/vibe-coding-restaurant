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
    <header className="bg-cream-100 shadow-sm border-b border-cream-300">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-forest-500 hover:text-forest-600 hover:bg-cream-200 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-forest-600 ml-2">
            {t("dashboard.title")}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <SocketStatus showLabel={false} className="mr-2" />

          {(user?.role === "waiter" || user?.role === "admin") && (
            <Link
              to="/mobile-redirect"
              className="flex items-center text-forest-500 hover:text-lime-600 transition-colors bg-cream-200 hover:bg-cream-300 p-2 rounded-xl"
              title={t("navigation.mobileApp")}
            >
              <DevicePhoneMobileIcon className="h-5 w-5" />
              <span className="ml-1 text-sm hidden lg:inline">
                {t("navigation.mobileApp")}
              </span>
            </Link>
          )}
          <div className="bg-cream-200 p-1 rounded-xl">
            <LanguageSelector />
          </div>
          <div className="bg-cream-200 p-1 rounded-xl">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
