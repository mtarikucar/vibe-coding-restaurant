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
import ThemeProvider from "./contexts/ThemeContext";

// Import the test component for debugging
import TestApp from "./TestApp";

// Mobile Layout
import MobileLayout from "./components/layout/MobileLayout";

// Public Pages
const PublicMenu = lazy(() => import("./pages/public/PublicMenu"));

// Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const TenantRegister = lazy(() => import("./pages/auth/TenantRegister"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));
const Dashboard = lazy(() => import("./pages/dashboard/DashboardNew"));
const Menu = lazy(() => import("./pages/menu/Menu"));
const Orders = lazy(() => import("./pages/order/Orders"));
const OrderDetail = lazy(() => import("./pages/order/OrderDetail"));
const NewOrder = lazy(() => import("./pages/order/NewOrder"));
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
const SystemInfo = lazy(() => import("./pages/settings/SystemInfo"));
const Campaigns = lazy(() => import("./pages/marketing/Campaigns"));
const CampaignForm = lazy(() => import("./pages/marketing/CampaignForm"));
const Invoices = lazy(() => import("./pages/invoice/Invoices"));
const InvoiceDetail = lazy(() => import("./pages/invoice/InvoiceDetail"));
const InvoiceForm = lazy(() => import("./pages/invoice/InvoiceForm"));

// Mobile Pages
const MobileRedirect = lazy(() => import("./pages/mobile/MobileRedirect"));
const MobileTables = lazy(() => import("./pages/mobile/MobileTables"));
const MobileOrders = lazy(() => import("./pages/mobile/MobileOrders"));
const MobileMenu = lazy(() => import("./pages/mobile/MobileMenu"));
const MobileProfile = lazy(() => import("./pages/mobile/MobileProfile"));
const MobileTableDetails = lazy(
  () => import("./pages/mobile/MobileTableDetails")
);
const MobileNewOrder = lazy(() => import("./pages/mobile/MobileNewOrder"));
const MobileOrderDetail = lazy(
  () => import("./pages/mobile/MobileOrderDetail")
);

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
        path: "register-restaurant",
        element: (
          <Suspense fallback={<Loading />}>
            <TenantRegister />
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
            path: "orders/new",
            element: (
              <Suspense fallback={<Loading />}>
                <NewOrder />
              </Suspense>
            ),
            // Admin, waiter, and cashier can access new order form
            handle: { allowedRoles: ["admin", "waiter", "cashier"] },
          },
          {
            path: "orders/:id",
            element: (
              <Suspense fallback={<Loading />}>
                <OrderDetail />
              </Suspense>
            ),
            // Admin, waiter, and cashier can access order details
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
            path: "settings/system",
            element: (
              <Suspense fallback={<Loading />}>
                <SystemInfo />
              </Suspense>
            ),
            // All authenticated users can access system information
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
          {
            path: "invoices",
            element: (
              <Suspense fallback={<Loading />}>
                <Invoices />
              </Suspense>
            ),
            // Admin and cashier can access invoices
            handle: { allowedRoles: ["admin", "cashier"] },
          },
          {
            path: "invoices/:id",
            element: (
              <Suspense fallback={<Loading />}>
                <InvoiceDetail />
              </Suspense>
            ),
            // Admin and cashier can access invoice details
            handle: { allowedRoles: ["admin", "cashier"] },
          },
          {
            path: "invoices/new",
            element: (
              <Suspense fallback={<Loading />}>
                <InvoiceForm />
              </Suspense>
            ),
            // Admin and cashier can create invoices
            handle: { allowedRoles: ["admin", "cashier"] },
          },
          {
            path: "invoices/new/:orderId",
            element: (
              <Suspense fallback={<Loading />}>
                <InvoiceForm />
              </Suspense>
            ),
            // Admin and cashier can create invoices
            handle: { allowedRoles: ["admin", "cashier"] },
          },
        ],
      },
    ],
  },
  {
    path: "/mobile-redirect",
    element: (
      <Suspense fallback={<Loading />}>
        <MobileRedirect />
      </Suspense>
    ),
  },
  {
    path: "/mobile",
    element: <ProtectedRoute allowedRoles={["admin", "waiter"]} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        path: "",
        element: <MobileLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/mobile/tables" replace />,
          },
          {
            path: "tables",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileTables />
              </Suspense>
            ),
          },
          {
            path: "tables/:tableId/details",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileTableDetails />
              </Suspense>
            ),
          },
          {
            path: "tables/:tableId/seat",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileTableDetails />
              </Suspense>
            ),
          },
          {
            path: "tables/:tableId/new-order",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileNewOrder />
              </Suspense>
            ),
          },
          {
            path: "orders",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileOrders />
              </Suspense>
            ),
          },
          {
            path: "orders/:orderId",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileOrderDetail />
              </Suspense>
            ),
          },
          {
            path: "menu",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileMenu />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <Suspense fallback={<Loading />}>
                <MobileProfile />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/menu/:tenantId",
    element: (
      <Suspense fallback={<Loading />}>
        <PublicMenu />
      </Suspense>
    ),
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
        <ThemeProvider>
          <LanguageManager />
          <RouterProvider router={router} />
        </ThemeProvider>
      </ToastProvider>
    </>
  );
}

export default App;
