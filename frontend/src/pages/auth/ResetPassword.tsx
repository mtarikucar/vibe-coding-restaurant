import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../services/api";

// Define error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset token");
        setTokenChecked(true);
        return;
      }

      try {
        const response = await authAPI.verifyResetToken(token);
        setTokenValid(response.valid);
        setTokenChecked(true);
      } catch (error: unknown) {
        setError("Invalid or expired reset token");
        setTokenChecked(true);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate form
    if (!password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(token, password, confirmPassword);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to reset password. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenChecked) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t("auth.verifyingToken")}</p>
      </div>
    );
  }

  if (!tokenValid && tokenChecked) {
    return (
      <div className="text-center">
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || t("auth.invalidResetToken")}
        </div>
        <p className="mt-4">
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:text-blue-800"
          >
            {t("auth.requestNewReset")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {t("auth.passwordResetSuccess")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="form-label">
            {t("auth.newPassword")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Enter your new password"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="form-label">
            {t("auth.confirmNewPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="Confirm your new password"
            disabled={loading || success}
          />
        </div>

        <div>
          <button
            type="submit"
            className={`btn w-full ${
              loading || success
                ? "bg-blue-300 cursor-not-allowed"
                : "btn-primary"
            }`}
            disabled={loading || success}
          >
            {loading ? t("common.loading") : t("auth.resetPassword")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
