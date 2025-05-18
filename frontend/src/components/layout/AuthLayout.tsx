import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AuthLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  // Update the condition to match the exact path
  const isRegisterPage = location.pathname === "/register";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {t("common.appName")}
          </h1>
          <p className="text-gray-600">
            {isRegisterPage ? t("auth.createAccount") : t("auth.accessAccount")}
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
