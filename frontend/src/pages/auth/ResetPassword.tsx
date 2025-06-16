import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "../../components/ui";
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
      <div className="text-center animate-fadeIn">
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          {error || t("auth.invalidResetToken")}
        </div>
        <p className="text-gray-600">
          <Link
            to="/forgot-password"
            className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            {t("auth.requestNewReset")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          {t("auth.passwordResetSuccess")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t("auth.newPassword")}
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your new password"
          disabled={loading || success}
          required
          fullWidth
          variant="default"
          size="md"
        />

        <Input
          label={t("auth.confirmNewPassword")}
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          disabled={loading || success}
          required
          fullWidth
          variant="default"
          size="md"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
          disabled={loading || success}
          size="lg"
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t("common.loading")}
            </div>
          ) : (
            t("auth.resetPassword")
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
