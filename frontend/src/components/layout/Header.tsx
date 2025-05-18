import { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../common/LanguageSelector";
import NotificationBell from "../notifications/NotificationBell";
import  useAuthStore from "../../store/authStore";

const Header = () => {
  const { t } = useTranslation();

  const { user } = useAuthStore();

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
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Header;
