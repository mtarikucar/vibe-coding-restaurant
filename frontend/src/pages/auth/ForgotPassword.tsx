import { useState } from "react";
import { Link } from "react-router-dom";
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
    <div>
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center">
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {t("auth.passwordResetSent")}
          </div>
          <p className="mt-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              {t("auth.returnToLogin")}
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="form-label">
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email address"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              className={`btn w-full ${
                loading ? "bg-blue-300 cursor-not-allowed" : "btn-primary"
              }`}
              disabled={loading}
            >
              {loading ? t("common.loading") : t("auth.resetPassword")}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.rememberPassword")}{" "}
              <Link
                to="/"
                className="font-medium text-blue-600 hover:text-blue-500"
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
