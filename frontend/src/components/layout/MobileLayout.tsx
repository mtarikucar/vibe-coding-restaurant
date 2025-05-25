import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import MobileNavigation from "./MobileNavigation";
import MobileHeader from "./MobileHeader";
import InstallPrompt from "../mobile/InstallPrompt";
import { useTranslation } from "react-i18next";

const MobileLayout: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  // Get the current page title based on the route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/mobile/tables")) return t("tables.title");
    if (path.includes("/mobile/orders")) return t("orders.title");
    if (path.includes("/mobile/menu")) return t("menu.title");
    if (path.includes("/mobile/profile")) return t("profile.title");
    return t("app.title");
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-100 dark:bg-darkGray-900">
      <MobileHeader title={getPageTitle()} />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <MobileNavigation />
      <InstallPrompt />
    </div>
  );
};

export default MobileLayout;
