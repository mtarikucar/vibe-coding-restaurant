import React, { useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { useTranslation } from"react-i18next";
import useAuthStore from"../../store/authStore";

const MobileRedirect: React.FC = () => {
 const navigate = useNavigate();
 const { t } = useTranslation();
 const { user } = useAuthStore();

 useEffect(() => {
  // Check if the user is a waiter
  if (user && (user.role ==="waiter" || user.role === "admin")) {
   // Redirect to the mobile app after a short delay
   const timer = setTimeout(() => {
    navigate("/mobile/tables");
   }, 2000);

   return () => clearTimeout(timer);
  } else {
   // If not a waiter, redirect to the main app
   navigate("/app/dashboard");
  }
 }, [navigate, user]);

 return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
   <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">
     {t("common.appName")}
    </h1>
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
    <p className="text-gray-600 mb-2">
     {t("common.loading")}
    </p>
    <p className="text-sm text-gray-500">
     {t("pwa.redirecting")}
    </p>
   </div>
  </div>
 );
};

export default MobileRedirect;
