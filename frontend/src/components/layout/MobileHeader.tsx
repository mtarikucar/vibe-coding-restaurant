import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../notifications/NotificationBell";
import SocketStatus from "../common/SocketStatus";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically show back button if not on a main tab route
  const shouldShowBackButton = () => {
    if (showBackButton) return true;

    const mainRoutes = [
      "/mobile/tables",
      "/mobile/orders",
      "/mobile/menu",
      "/mobile/profile",
    ];

    return !mainRoutes.some((route) => location.pathname === route);
  };

  return (
    <header className="bg-cream-100 shadow-sm sticky top-0 z-10 border-b border-cream-300">
      <div className="flex justify-between items-center py-4 px-4">
        <div className="flex items-center">
          {shouldShowBackButton() && (
            <button
              onClick={() => navigate(-1)}
              className="mr-2 p-1.5 rounded-xl hover:bg-cream-200 text-forest-500"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-forest-600">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-cream-200 p-1 rounded-xl">
            <SocketStatus showLabel={false} />
          </div>
          <div className="bg-cream-200 p-1 rounded-xl">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
