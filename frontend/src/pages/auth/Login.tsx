import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../services/api";
import useAuthStore, { AuthProvider } from "../../store/authStore";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

// Define error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");
    const error = params.get("error");

    if (error) {
      setError(decodeURIComponent(error));
      // Clean up the URL
      navigate("/", { replace: true });
      return;
    }

    if (accessToken && refreshToken && expiresIn) {
      // We have OAuth tokens, get user profile
      const fetchUserProfile = async () => {
        try {
          setOauthLoading(true);
          // Set the token temporarily to make the API call
          localStorage.setItem("temp_token", accessToken);

          const user = await authAPI.getProfile();

          // Store in auth store
          login(
            user,
            accessToken,
            refreshToken,
            parseInt(expiresIn, 10),
            AuthProvider.GOOGLE // Assuming Google for now
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
          console.error("Failed to get user profile:", error);
          setError("Failed to complete OAuth login. Please try again.");
          localStorage.removeItem("temp_token");
        } finally {
          setOauthLoading(false);
          // Clean up the URL
          navigate("/", { replace: true });
        }
      };

      fetchUserProfile();
    }
  }, [location, navigate, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);

      // Handle both old and new API response formats
      const user = response.user;

      // Check if we have the new token format or the old one
      if (response.accessToken && response.refreshToken && response.expiresIn) {
        // New format
        const { accessToken, refreshToken, expiresIn } = response;
        login(user, accessToken, refreshToken, expiresIn);
      } else if (response.token) {
        // Old format - use default values for refresh token
        login(user, response.token, "", 86400, AuthProvider.LOCAL); // 24 hours expiry
      } else {
        throw new Error("Invalid response format from server");
      }

      // Redirect based on user role with replace: true to avoid history issues
      if (user.role === "kitchen") {
        navigate("/app/kitchen", { replace: true });
      } else if (user.role === "cashier") {
        navigate("/app/payments", { replace: true });
      } else {
        navigate("/app/dashboard", { replace: true });
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid username or password");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = "/api/auth/oauth/google";
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="form-label">
            {t("auth.username")}
          </label>
          <input
            type="text"
            id="username"
            className="form-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="form-label">
            {t("auth.password")}
          </label>
          <input
            type="password"
            id="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-1 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t("auth.forgotPasswordQuestion")}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`btn btn-primary w-full ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading || oauthLoading}
          >
            {loading ? t("common.loading") : t("auth.signIn")}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {t("auth.orContinueWith")}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || oauthLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
            <span className="ml-2">Google</span>
          </button>

          <button
            type="button"
            disabled={true} // Not implemented yet
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 opacity-50 cursor-not-allowed"
          >
            <FaGithub className="h-5 w-5" />
            <span className="ml-2">GitHub</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("auth.dontHaveAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t("auth.registerNow")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
