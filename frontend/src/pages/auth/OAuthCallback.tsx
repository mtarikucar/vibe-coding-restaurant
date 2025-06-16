import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../services/api";
import useAuthStore, { AuthProvider } from "../../store/authStore";

const OAuthCallback = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Parse the URL parameters
      const params = new URLSearchParams(location.search);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");
      const errorParam = params.get("error");
      const provider = params.get("provider") || "google"; // Default to Google if not specified

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        return;
      }

      if (!accessToken || !refreshToken || !expiresIn) {
        setError("Invalid OAuth callback. Missing required parameters.");
        return;
      }

      try {
        // Set the token temporarily to make the API call
        localStorage.setItem("temp_token", accessToken);

        // Get user profile
        const user = await authAPI.getProfile();

        // Determine the auth provider
        let authProvider = AuthProvider.GOOGLE;
        if (provider === "github") {
          authProvider = AuthProvider.GITHUB;
        }

        // Store in auth store
        login(
          user,
          accessToken,
          refreshToken,
          parseInt(expiresIn, 10),
          authProvider
        );

        // Remove temp token
        localStorage.removeItem("temp_token");

        // Redirect based on user role
        if (user.role === "kitchen") {
          navigate("/app/kitchen", { replace: true });
        } else if (user.role === "cashier") {
          navigate("/app/payments", { replace: true });
        } else {
          navigate("/app/dashboard", { replace: true });
        }
      } catch (error) {
        console.error("Failed to complete OAuth login:", error);
        setError("Failed to complete OAuth login. Please try again.");
        localStorage.removeItem("temp_token");
      }
    };

    processOAuthCallback();
  }, [location, navigate, login]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md w-full">
          {error}
        </div>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          {t("common.backToLogin")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      <p className="mt-4 text-gray-600">{t("auth.completingLogin")}</p>
    </div>
  );
};

export default OAuthCallback;
