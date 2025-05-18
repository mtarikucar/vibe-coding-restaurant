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

  // Check if the user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate page based on the user's role
    if (user.role === "kitchen") {
      return <Navigate to="/app/kitchen" replace />;
    } else if (user.role === "cashier") {
      return <Navigate to="/app/payments" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // If the user is authenticated and has the required role, render the children
  return <Outlet />;
};

export default ProtectedRoute;
