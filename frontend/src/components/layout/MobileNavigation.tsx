import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  TableCellsIcon as TableCellsIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: "/mobile/tables",
      label: t("navigation.tables"),
      icon: isActive("/mobile/tables") ? (
        <TableCellsIconSolid className="h-6 w-6" />
      ) : (
        <TableCellsIcon className="h-6 w-6" />
      ),
    },
    {
      path: "/mobile/orders",
      label: t("navigation.orders"),
      icon: isActive("/mobile/orders") ? (
        <ClipboardDocumentListIconSolid className="h-6 w-6" />
      ) : (
        <ClipboardDocumentListIcon className="h-6 w-6" />
      ),
    },
    {
      path: "/mobile/menu",
      label: t("navigation.menu"),
      icon: isActive("/mobile/menu") ? (
        <HomeIconSolid className="h-6 w-6" />
      ) : (
        <HomeIcon className="h-6 w-6" />
      ),
    },
    {
      path: "/mobile/profile",
      label: t("navigation.profile"),
      icon: isActive("/mobile/profile") ? (
        <UserIconSolid className="h-6 w-6" />
      ) : (
        <UserIcon className="h-6 w-6" />
      ),
    },
  ];

  return (
    <nav className="bg-primary-600 dark:bg-primary-800 shadow-lg fixed bottom-0 left-0 right-0 z-10 rounded-t-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full rounded-xl py-2 ${
              isActive(item.path)
                ? "text-primary-900 bg-primary-300 dark:bg-primary-400"
                : "text-neutral-100 hover:bg-primary-500 dark:hover:bg-primary-700"
            }`}
          >
            <div className="mb-0.5">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;
