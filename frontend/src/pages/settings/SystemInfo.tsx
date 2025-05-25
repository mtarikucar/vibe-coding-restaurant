import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Cog6ToothIcon,
  UserIcon,
  KeyIcon,
  CreditCardIcon,
  SwatchIcon,
  ServerIcon,
  BuildingLibraryIcon,
  InformationCircleIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import { authAPI } from "../../services/api";
import { Card, Button } from "../../components/ui";
import { useTheme, type ThemeType } from "../../contexts/ThemeContext";
import { useToast } from "../../components/common/ToastProvider";

// Theme options
const themeOptions = [
  {
    id: "system",
    name: "System Default",
    color: "#A0C878",
    icon: ComputerDesktopIcon,
    description:
      "Automatically switches between light and dark based on your system preferences.",
  },
  {
    id: "light",
    name: "Light",
    color: "#FFFDF6",
    icon: SunIcon,
    description: "Bright theme with light colors, ideal for daytime use.",
  },
  {
    id: "dark",
    name: "Dark",
    color: "#2C3333",
    icon: MoonIcon,
    description:
      "Dark theme with reduced brightness, perfect for nighttime use and reducing eye strain.",
  },
];

const SystemInfo: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<string>("theme");
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(theme);
  const [systemInfo, setSystemInfo] = useState({
    version: "1.0.0",
    environment: "Production",
    serverStatus: "Online",
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // You could fetch system information from the server here
    // For now, we'll just use the mock data
  }, []);

  // Update selected theme when theme changes
  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId as ThemeType);
  };

  const saveThemeChanges = () => {
    setTheme(selectedTheme);
    success(t("system.themeUpdated"));

    // Apply theme change immediately
    const root = document.documentElement;
    if (selectedTheme === "dark") {
      root.classList.add("dark");
    } else if (selectedTheme === "light") {
      root.classList.remove("dark");
    } else {
      // Check browser preference for system theme
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const tabs = [
    {
      id: "theme",
      name: t("system.theme"),
      icon: SwatchIcon,
      roles: ["admin", "waiter", "kitchen", "cashier", "manager"],
    },
    {
      id: "subscription",
      name: t("system.subscription"),
      icon: CreditCardIcon,
      roles: ["admin"],
    },
    {
      id: "profile",
      name: t("system.profile"),
      icon: UserIcon,
      roles: ["admin", "waiter", "kitchen", "cashier", "manager"],
    },
    {
      id: "access",
      name: t("system.access"),
      icon: KeyIcon,
      roles: ["admin"],
    },
    {
      id: "tenant",
      name: t("system.tenant"),
      icon: BuildingLibraryIcon,
      roles: ["admin"],
    },
    {
      id: "system",
      name: t("system.information"),
      icon: ServerIcon,
      roles: ["admin"],
    },
  ];

  // Filter tabs based on user role
  const filteredTabs = tabs.filter(
    (tab) => user && tab.roles.includes(user.role)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-700 dark:text-neutral-200">
          {t("system.title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="divide-y divide-neutral-300 dark:divide-darkGray-700">
              {filteredTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-100 text-primary-700 dark:bg-darkGray-700 dark:text-primary-300"
                      : "hover:bg-neutral-200 text-primary-600 dark:hover:bg-darkGray-600 dark:text-neutral-300"
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            {/* Theme Settings */}
            {activeTab === "theme" && (
              <div>
                <h2 className="text-xl font-semibold text-primary-700 dark:text-neutral-200 mb-4">
                  {t("system.themeSettings")}
                </h2>
                <p className="text-primary-600 dark:text-neutral-400 mb-6">
                  {t("system.themeDescription")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {themeOptions.map((themeOption) => (
                    <div
                      key={themeOption.id}
                      onClick={() => handleThemeChange(themeOption.id)}
                      className={`border rounded-xl p-5 cursor-pointer transition-all ${
                        selectedTheme === themeOption.id
                          ? "border-primary-500 bg-primary-50 dark:bg-neutral-700 dark:border-primary-400"
                          : "border-neutral-300 hover:border-primary-300 dark:border-neutral-600 dark:hover:border-primary-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-primary-700 dark:text-primary-300">
                          {themeOption.name}
                        </span>
                        <themeOption.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div
                        className="w-full h-24 rounded-lg mb-3 shadow-sm"
                        style={{ backgroundColor: themeOption.color }}
                      ></div>
                      <div className="flex items-center mb-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                            selectedTheme === themeOption.id
                              ? "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400"
                              : "border-neutral-300 dark:border-neutral-500"
                          }`}
                        ></div>
                        <span className="ml-2 font-medium text-primary-700 dark:text-neutral-200">
                          {themeOption.name}
                        </span>
                      </div>
                      <p className="text-sm text-primary-600 dark:text-neutral-300 mt-2">
                        {themeOption.description}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={saveThemeChanges}
                  disabled={selectedTheme === theme}
                >
                  {selectedTheme === theme
                    ? t("system.currentTheme")
                    : t("common.saveChanges")}
                </Button>
              </div>
            )}

            {/* Subscription Information */}
            {activeTab === "subscription" && (
              <div>
                <h2 className="text-xl font-semibold text-forest-600 mb-4">
                  {t("system.subscriptionInfo")}
                </h2>
                <p className="text-forest-500 mb-6">
                  {t("system.subscriptionDescription")}
                </p>

                <div className="bg-cream-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-forest-600 font-medium">
                      {t("system.currentPlan")}:
                    </span>
                    <span className="text-forest-700 font-semibold">
                      {user?.subscriptionStatus === "TRIAL"
                        ? t("subscription.trial")
                        : t("subscription.premium")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-forest-600 font-medium">
                      {t("system.status")}:
                    </span>
                    <span className="text-lime-600 font-semibold">
                      {t("subscription.active")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-forest-600 font-medium">
                      {t("system.nextBilling")}:
                    </span>
                    <span className="text-forest-700 font-semibold">
                      {user?.trialEndDate
                        ? new Date(user.trialEndDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  as="link"
                  to="/app/subscription"
                  className="mt-4"
                >
                  {t("subscription.managePlan")}
                </Button>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-semibold text-forest-600 mb-4">
                  {t("system.profileSettings")}
                </h2>
                <p className="text-forest-500 mb-6">
                  {t("system.profileDescription")}
                </p>

                <div className="bg-cream-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-lime-200 flex items-center justify-center text-forest-700 font-bold mr-4">
                      {user?.fullName.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-forest-600">
                        {user?.fullName}
                      </h3>
                      <p className="text-forest-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.username")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {user?.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.role")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {t(`roles.${user?.role}`)}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.language")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {user?.preferredLanguage
                          ? t(`languages.${user.preferredLanguage}`)
                          : t("languages.en")}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    // Implement profile edit functionality
                  }}
                >
                  {t("system.editProfile")}
                </Button>
              </div>
            )}

            {/* Access Types */}
            {activeTab === "access" && (
              <div>
                <h2 className="text-xl font-semibold text-forest-600 mb-4">
                  {t("system.accessTypes")}
                </h2>
                <p className="text-forest-500 mb-6">
                  {t("system.accessDescription")}
                </p>

                <div className="space-y-4">
                  {["admin", "manager", "waiter", "kitchen", "cashier"].map(
                    (role) => (
                      <div
                        key={role}
                        className="bg-cream-200 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <KeyIcon className="h-5 w-5 text-forest-500 mr-3" />
                          <span className="font-medium text-forest-600">
                            {t(`roles.${role}`)}
                          </span>
                        </div>
                        <div className="text-forest-500 text-sm">
                          {role === "admin"
                            ? t("system.fullAccess")
                            : t("system.limitedAccess")}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <Button
                  variant="primary"
                  as="link"
                  to="/app/users"
                  className="mt-6"
                >
                  {t("system.manageUsers")}
                </Button>
              </div>
            )}

            {/* Tenant Information */}
            {activeTab === "tenant" && (
              <div>
                <h2 className="text-xl font-semibold text-forest-600 mb-4">
                  {t("system.tenantInfo")}
                </h2>
                <p className="text-forest-500 mb-6">
                  {t("system.tenantDescription")}
                </p>

                <div className="bg-cream-200 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.tenantName")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {user?.tenant?.name || "Default"}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.tenantId")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {user?.tenantId || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.country")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {user?.country || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            {activeTab === "system" && (
              <div>
                <h2 className="text-xl font-semibold text-forest-600 mb-4">
                  {t("system.systemInfo")}
                </h2>
                <p className="text-forest-500 mb-6">
                  {t("system.systemDescription")}
                </p>

                <div className="bg-cream-200 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.version")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {systemInfo.version}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.environment")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {systemInfo.environment}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.serverStatus")}:
                      </span>
                      <span className="text-lime-600 ml-2 font-medium">
                        {systemInfo.serverStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-forest-600 font-medium">
                        {t("system.lastUpdated")}:
                      </span>
                      <span className="text-forest-700 ml-2">
                        {new Date(systemInfo.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
