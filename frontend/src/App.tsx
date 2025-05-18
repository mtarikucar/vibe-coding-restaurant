import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";

// Layouts
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SocketInitializer from "./components/common/SocketInitializer";
import ToastProvider from "./components/common/ToastProvider";
import LanguageManager from "./components/common/LanguageManager";

// Import the test component for debugging
import TestApp from "./TestApp";

// Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Menu = lazy(() => import("./pages/menu/Menu"));
const Orders = lazy(() => import("./pages/order/Orders"));
const Kitchen = lazy(() => import("./pages/kitchen/Kitchen"));
const Tables = lazy(() => import("./pages/table/Tables"));
const Payments = lazy(() => import("./pages/payment/Payments"));
const PaymentPage = lazy(() => import("./pages/payment/PaymentPage"));
const Stock = lazy(() => import("./pages/stock/Stock"));
const Suppliers = lazy(() => import("./pages/stock/Suppliers"));
const PurchaseOrders = lazy(() => import("./pages/stock/PurchaseOrders"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const AdvancedReports = lazy(() => import("./pages/reports/AdvancedReports"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const PerformanceMonitoring = lazy(
  () => import("./pages/admin/PerformanceMonitoring")
);
const SubscriptionPlans = lazy(
  () => import("./pages/subscription/SubscriptionPlans")
);
const SubscriptionCheckout = lazy(
  () => import("./pages/subscription/SubscriptionCheckout")
);
const NotificationSettings = lazy(
  () => import("./pages/settings/NotificationSettings")
);
const Campaigns = lazy(() => import("./pages/marketing/Campaigns"));
const CampaignForm = lazy(() => import("./pages/marketing/CampaignForm"));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Error component
const ErrorFallback = () => (
  <div className="min-h-screen bg-red-100 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-3xl font-bold text-red-800">Error</h1>
      <p className="text-gray-600">Something went wrong with the router.</p>
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => (window.location.href = "/")}
      >
        Go Home
      </button>
    </div>
  </div>
);

// Create router with updated configuration for React Router v7
const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true, // Use index: true for the root path
        element: (
          <Suspense fallback={<Loading />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <Suspense fallback={<Loading />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <Suspense fallback={<Loading />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: "reset-password",
        element: (
          <Suspense fallback={<Loading />}>
            <ResetPassword />
          </Suspense>
        ),
      },
      {
        path: "oauth/callback",
        element: (
          <Suspense fallback={<Loading />}>
            <OAuthCallback />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/app",
    element: <ProtectedRoute />,
    errorElement: <ErrorFallback />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          {
            index: true, // Use index: true for the root path
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            ),
          },
          {
            path: "menu",
            element: (
              <Suspense fallback={<Loading />}>
                <Menu />
              </Suspense>
            ),
            // Only admin and waiter can access menu management
            handle: { allowedRoles: ["admin", "waiter"] },
          },
          {
            path: "orders",
            element: (
              <Suspense fallback={<Loading />}>
                <Orders />
              </Suspense>
            ),
            // Admin, waiter, and cashier can access orders
            handle: { allowedRoles: ["admin", "waiter", "cashier"] },
          },
          {
            path: "kitchen",
            element: (
              <Suspense fallback={<Loading />}>
                <Kitchen />
              </Suspense>
            ),
            // Admin and kitchen staff can access kitchen panel
            handle: { allowedRoles: ["admin", "kitchen"] },
          },
          {
            path: "tables",
            element: (
              <Suspense fallback={<Loading />}>
                <Tables />
              </Suspense>
            ),
            // Admin and waiter can access table management
            handle: { allowedRoles: ["admin", "waiter"] },
          },
          {
            path: "payments",
            element: (
              <Suspense fallback={<Loading />}>
                <Payments />
              </Suspense>
            ),
            // Admin and cashier can access payments
            handle: { allowedRoles: ["admin", "cashier"] },
          },
          {
            path: "payments/process/:orderId",
            element: (
              <Suspense fallback={<Loading />}>
                <PaymentPage />
              </Suspense>
            ),
            // Admin and cashier can access payment processing
            handle: { allowedRoles: ["admin", "cashier"] },
          },
          {
            path: "stock",
            element: (
              <Suspense fallback={<Loading />}>
                <Stock />
              </Suspense>
            ),
            // Only admin can access stock management
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "stock/suppliers",
            element: (
              <Suspense fallback={<Loading />}>
                <Suppliers />
              </Suspense>
            ),
            // Only admin can access supplier management
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "stock/purchase-orders",
            element: (
              <Suspense fallback={<Loading />}>
                <PurchaseOrders />
              </Suspense>
            ),
            // Only admin can access purchase order management
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "reports",
            element: (
              <Suspense fallback={<Loading />}>
                <Reports />
              </Suspense>
            ),
            // Only admin can access reports
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "reports/advanced",
            element: (
              <Suspense fallback={<Loading />}>
                <AdvancedReports />
              </Suspense>
            ),
            // Only admin can access advanced reports
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "users",
            element: (
              <Suspense fallback={<Loading />}>
                <UserManagement />
              </Suspense>
            ),
            // Only admin can access user management
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "performance",
            element: (
              <Suspense fallback={<Loading />}>
                <PerformanceMonitoring />
              </Suspense>
            ),
            // Only admin can access performance monitoring
            handle: { allowedRoles: ["admin"] },
          },
          {
            path: "subscription",
            element: (
              <Suspense fallback={<Loading />}>
                <SubscriptionPlans />
              </Suspense>
            ),
            // All authenticated users can access subscription management
          },
          {
            path: "subscription/checkout/:planId",
            element: (
              <Suspense fallback={<Loading />}>
                <SubscriptionCheckout />
              </Suspense>
            ),
            // All authenticated users can access subscription checkout
          },
          {
            path: "settings/notifications",
            element: (
              <Suspense fallback={<Loading />}>
                <NotificationSettings />
              </Suspense>
            ),
            // All authenticated users can access notification settings
          },
          {
            path: "campaigns",
            element: (
              <Suspense fallback={<Loading />}>
                <Campaigns />
              </Suspense>
            ),
            // Only admin and marketing roles can access campaigns
            handle: { allowedRoles: ["admin", "marketing", "manager"] },
          },
          {
            path: "campaigns/new",
            element: (
              <Suspense fallback={<Loading />}>
                <CampaignForm />
              </Suspense>
            ),
            // Only admin and marketing roles can access campaign form
            handle: { allowedRoles: ["admin", "marketing", "manager"] },
          },
          {
            path: "campaigns/edit/:id",
            element: (
              <Suspense fallback={<Loading />}>
                <CampaignForm />
              </Suspense>
            ),
            // Only admin and marketing roles can access campaign form
            handle: { allowedRoles: ["admin", "marketing", "manager"] },
          },
        ],
      },
    ],
  },
  {
    path: "/test",
    element: <TestApp />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return (
    <>
      <SocketInitializer />
      <ToastProvider>
        <LanguageManager />
        <RouterProvider router={router} />
      </ToastProvider>
    </>
  );
}

export default App;
