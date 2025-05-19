import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../services/api";
import useAuthStore, { AuthProvider } from "../../store/authStore";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import {
  UserIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Card } from "../../components/ui";

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

  const handleGithubLogin = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = "/api/auth/oauth/github";
  };

  return (
    <div className="animate-fadeIn">
      <Card variant="default" className="mb-6">
        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-danger-500 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t("auth.username")}
            id="username"
            type="text"
            placeholder={t("auth.usernamePlaceholder") || "Username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            leftIcon={<UserIcon className="h-5 w-5" />}
            variant="default"
            size="md"
          />

          <div>
            <Input
              label={t("auth.password")}
              id="password"
              type="password"
              placeholder={t("auth.passwordPlaceholder") || "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              variant="default"
              size="md"
            />
            <div className="mt-1 text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                {t("auth.forgotPasswordQuestion")}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={loading || oauthLoading}
            size="lg"
          >
            {loading ? t("common.loading") : t("auth.signIn")}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading || oauthLoading}
              fullWidth
              leftIcon={<FcGoogle className="h-5 w-5" />}
            >
              Google
            </Button>

            <Button
              variant="outline"
              onClick={handleGithubLogin}
              disabled={loading || oauthLoading}
              fullWidth
              leftIcon={<FaGithub className="h-5 w-5" />}
            >
              GitHub
            </Button>
          </div>
        </div>
      </Card>

      <div className="text-center animate-fadeIn space-y-2">
        <p className="text-sm text-gray-600">
          {t("auth.dontHaveAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {t("auth.registerNow")}
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          {t("auth.areYouRestaurant")}{" "}
          <Link
            to="/register-restaurant"
            className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {t("auth.registerRestaurantNow")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
