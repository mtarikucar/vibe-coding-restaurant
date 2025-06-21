import React, { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
import {
 Cog6ToothIcon,
 UserIcon,
 KeyIcon,
 CreditCardIcon,
 ServerIcon,
 BuildingLibraryIcon,
 InformationCircleIcon,
} from"@heroicons/react/24/outline";
import useAuthStore from"../../store/authStore";
import { authAPI } from"../../services/api";
import { Card, Button } from"../../components/ui";
import { useToast } from"../../components/common/ToastProvider";



const SystemInfo: React.FC = () => {
 const { t } = useTranslation();
 const { user } = useAuthStore();
 const { success } = useToast();
 const [activeTab, setActiveTab] = useState<string>("subscription");
 const [systemInfo, setSystemInfo] = useState({
  version:"1.0.0",
  environment:"Production",
  serverStatus:"Online",
  lastUpdated: new Date().toISOString(),
 });
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  // You could fetch system information from the server here
  // For now, we'll just use the mock data
 }, []);



 const tabs = [
  {
   id:"subscription",
   name: t("system.subscription"),
   icon: CreditCardIcon,
   roles: ["admin"],
  },
  {
   id:"profile",
   name: t("system.profile"),
   icon: UserIcon,
   roles: ["admin","waiter", "kitchen", "cashier", "manager"],
  },
  {
   id:"access",
   name: t("system.access"),
   icon: KeyIcon,
   roles: ["admin"],
  },
  {
   id:"tenant",
   name: t("system.tenant"),
   icon: BuildingLibraryIcon,
   roles: ["admin"],
  },
  {
   id:"system",
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
    <h1 className="text-2xl font-bold text-primary-700">
     {t("system.title")}
    </h1>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Sidebar */}
    <div className="lg:col-span-1">
     <Card className="overflow-hidden">
      <div className="divide-y divide-neutral-300">
       {filteredTabs.map((tab) => (
        <button
         key={tab.id}
         onClick={() => setActiveTab(tab.id)}
         className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
          activeTab === tab.id
           ?"bg-primary-100 text-primary-700"
           :"hover:bg-neutral-200 text-primary-600"
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


      {/* Subscription Information */}
      {activeTab ==="subscription" && (
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
           {user?.subscriptionStatus ==="TRIAL"
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
            :"N/A"}
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
      {activeTab ==="profile" && (
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
           {user?.fullName.charAt(0) ||"U"}
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
      {activeTab ==="access" && (
       <div>
        <h2 className="text-xl font-semibold text-forest-600 mb-4">
         {t("system.accessTypes")}
        </h2>
        <p className="text-forest-500 mb-6">
         {t("system.accessDescription")}
        </p>

        <div className="space-y-4">
         {["admin","manager", "waiter", "kitchen", "cashier"].map(
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
             {role ==="admin"
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
      {activeTab ==="tenant" && (
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
            {user?.tenant?.name ||"Default"}
           </span>
          </div>
          <div>
           <span className="text-forest-600 font-medium">
            {t("system.tenantId")}:
           </span>
           <span className="text-forest-700 ml-2">
            {user?.tenantId ||"N/A"}
           </span>
          </div>
          <div>
           <span className="text-forest-600 font-medium">
            {t("system.country")}:
           </span>
           <span className="text-forest-700 ml-2">
            {user?.country ||"N/A"}
           </span>
          </div>
         </div>
        </div>
       </div>
      )}

      {/* System Information */}
      {activeTab ==="system" && (
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
