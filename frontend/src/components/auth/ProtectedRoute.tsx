import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import type { UserRole } from "../../store/authStore";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // Check if the user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Super admins have access to everything
  if (user.isSuperAdmin || user.role === "super_admin") {
    return <Outlet />;
  }

  // Check if the user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate page based on the user's role
    switch (user.role) {
      case "kitchen":
        return <Navigate to="/app/kitchen" replace />;
      case "cashier":
        return <Navigate to="/app/payments" replace />;
      case "inventory":
        return <Navigate to="/app/stock" replace />;
      case "manager":
        return <Navigate to="/app/dashboard" replace />;
      case "marketing":
        return <Navigate to="/app/campaigns" replace />;
      default:
        return <Navigate to="/app/dashboard" replace />;
    }
  }

  // If the user is authenticated and has the required role, render the children
  return <Outlet />;
};

export default ProtectedRoute;
