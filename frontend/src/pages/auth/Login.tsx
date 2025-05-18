import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../services/api";
import useAuthStore from "../../store/authStore";

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

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, token } = await authAPI.login(username, password);

      // Store user and token in Zustand store
      login(user, token);

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
            disabled={loading}
          >
            {loading ? t("common.loading") : t("auth.signIn")}
          </button>
        </div>
      </form>

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
