import { useState } from "react";
import { Link } from "react-router-dom";
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

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate email
    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to send password reset email. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center">
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            {t("auth.passwordResetSent")}
          </div>
          <p className="text-gray-600">
            <Link
              to="/"
              className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              {t("auth.returnToLogin")}
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t("auth.email")}
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={loading}
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
            disabled={loading}
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.rememberPassword")}{" "}
              <Link
                to="/"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
