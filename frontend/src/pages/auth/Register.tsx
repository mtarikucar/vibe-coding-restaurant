import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import type { UserRole } from "../../store/authStore";

// Define error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("waiter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate form
    if (!username || !password || !confirmPassword || !fullName || !email) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Email validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(username, password, fullName, role, email);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        // Use navigate with { replace: true } to avoid history issues
        navigate("/", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
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

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Registration successful! Redirecting to login...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="form-label">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form-input"
            placeholder="Enter your full name"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            placeholder="Enter your username"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="Enter your email address"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="Enter your password"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="Confirm your password"
            disabled={loading || success}
          />
        </div>

        <div>
          <label htmlFor="role" className="form-label">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="form-input"
            disabled={loading || success}
          >
            <option value="waiter">Waiter</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
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
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          Are you a restaurant owner?{" "}
          <Link
            to="/register-restaurant"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Register your restaurant
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
