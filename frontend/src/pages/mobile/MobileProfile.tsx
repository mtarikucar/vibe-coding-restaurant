import React from"react";
import { useNavigate } from"react-router-dom";
import useAuthStore from"../../store/authStore";
import { useTranslation } from"react-i18next";
import {
 UserIcon,
 LanguageIcon,
 BellIcon,
 ArrowRightOnRectangleIcon,
 Cog6ToothIcon,
} from"@heroicons/react/24/outline";
import LanguageSelector from"../../components/common/LanguageSelector";

const MobileProfile: React.FC = () => {
 const { user, logout } = useAuthStore();
 const navigate = useNavigate();
 const { t } = useTranslation();

 const handleLogout = () => {
  logout();
  navigate("/");
 };

 return (
  <div className="p-4">
   <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div className="p-6">
     <div className="flex items-center">
      <div className="bg-blue-100 p-3 rounded-full">
       <UserIcon className="h-8 w-8 text-blue-600" />
      </div>
      <div className="ml-4">
       <h2 className="text-xl font-semibold text-gray-900">
        {user?.fullName}
       </h2>
       <p className="text-sm text-gray-500">
        {t(`roles.${user?.role}`)}
       </p>
      </div>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div className="p-4">
     <h3 className="text-lg font-medium text-gray-900 mb-2">
      {t("profile.settings")}
     </h3>
     <div className="space-y-2">
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
       <div className="flex items-center">
        <LanguageIcon className="h-5 w-5 text-gray-500 mr-3" />
        <span className="text-gray-700">{t("profile.language")}</span>
       </div>
       <LanguageSelector />
      </div>
      <div
       className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
       onClick={() => navigate("/mobile/notifications")}
      >
       <div className="flex items-center">
        <BellIcon className="h-5 w-5 text-gray-500 mr-3" />
        <span className="text-gray-700">
         {t("profile.notifications")}
        </span>
       </div>
       <div className="text-gray-400">
        <svg
         xmlns="http://www.w3.org/2000/svg"
         className="h-5 w-5"
         viewBox="0 0 20 20"
         fill="currentColor"
        >
         <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
         />
        </svg>
       </div>
      </div>
      <div
       className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
       onClick={() => navigate("/mobile/settings")}
      >
       <div className="flex items-center">
        <Cog6ToothIcon className="h-5 w-5 text-gray-500 mr-3" />
        <span className="text-gray-700">{t("profile.settings")}</span>
       </div>
       <div className="text-gray-400">
        <svg
         xmlns="http://www.w3.org/2000/svg"
         className="h-5 w-5"
         viewBox="0 0 20 20"
         fill="currentColor"
        >
         <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
         />
        </svg>
       </div>
      </div>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-4">
     <button
      className="flex items-center justify-center w-full p-3 text-red-600 hover:bg-red-50 rounded-lg"
      onClick={handleLogout}
     >
      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
      {t("auth.logout")}
     </button>
    </div>
   </div>

   <div className="mt-8 text-center text-xs text-gray-500">
    <p>
     {t("app.version")}: 1.0.0
    </p>
   </div>
  </div>
 );
};

export default MobileProfile;
