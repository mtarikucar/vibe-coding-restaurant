import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import usePerformanceMonitoring from "../../hooks/usePerformanceMonitoring";
import { dashboardAPI } from "../../services/api";
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  formatDateFns,
  formatNumber,
  formatPercentage,
  getCurrencySymbol,
} from "../../utils/formatters";

// Stats card component
const StatsCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow p-5">
    <div className="flex items-center">
      <div className={`rounded-full p-3 ${color}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

interface Order {
  id: string;
  orderNumber: string;
  table: { id: string; number: number };
  items: Array<any>;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface PopularItem {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState({
    stats: false,
    orders: false,
    popularItems: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    dailySales: "0",
    activeOrders: "0",
    customers: "0",
    avgTime: "0",
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);

  // Initialize performance monitoring
  const { trackAsyncOperation } = usePerformanceMonitoring("Dashboard", {
    trackMount: true,
    trackRender: true,
    metadata: { component: "Dashboard" },
  });

  const fetchDashboardData = async () => {
    setError(null);

    try {
      await trackAsyncOperation("fetchDashboardData", async () => {
        // Fetch stats
        setLoading((prev) => ({ ...prev, stats: true }));
        const statsData = await trackAsyncOperation(
          "fetchStats",
          () => dashboardAPI.getStats(period),
          { period }
        );

        setStats({
          dailySales: formatCurrency(statsData.totalSales || 0),
          activeOrders: formatNumber(statsData.activeOrdersCount || 0),
          customers: formatNumber(statsData.orderCount || 0),
          avgTime: statsData.avgPrepTime
            ? `${formatNumber(statsData.avgPrepTime)} ${t(
                "common.time.minutes"
              )}`
            : "18 min",
        });
        setLoading((prev) => ({ ...prev, stats: false }));

        // Fetch active orders
        setLoading((prev) => ({ ...prev, orders: true }));
        const ordersData = await trackAsyncOperation("fetchActiveOrders", () =>
          dashboardAPI.getActiveOrders()
        );

        setRecentOrders(ordersData);
        setLoading((prev) => ({ ...prev, orders: false }));

        // Fetch popular items
        setLoading((prev) => ({ ...prev, popularItems: true }));
        const popularItemsData = await trackAsyncOperation(
          "fetchPopularItems",
          () => dashboardAPI.getPopularItems(5),
          { limit: 5 }
        );

        setPopularItems(popularItemsData);
        setLoading((prev) => ({ ...prev, popularItems: false }));
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading({
        stats: false,
        orders: false,
        popularItems: false,
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-gray-600 bg-gray-100";
      case "preparing":
        return "text-yellow-600 bg-yellow-100";
      case "ready":
        return "text-orange-600 bg-orange-100";
      case "served":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handlePeriodChange = (newPeriod: "day" | "week" | "month") => {
    setPeriod(newPeriod);
  };

  return (
    <div>
      {/* Header with period selector and refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("dashboard.title")}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePeriodChange("day")}
              className={`px-3 py-1 rounded-md text-sm ${
                period === "day"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t("dashboard.periods.day")}
            </button>
            <button
              onClick={() => handlePeriodChange("week")}
              className={`px-3 py-1 rounded-md text-sm ${
                period === "week"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t("dashboard.periods.week")}
            </button>
            <button
              onClick={() => handlePeriodChange("month")}
              className={`px-3 py-1 rounded-md text-sm ${
                period === "month"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t("dashboard.periods.month")}
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            title={t("common.refresh")}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={`${
              period === "day"
                ? "Daily"
                : period === "week"
                ? "Weekly"
                : "Monthly"
            } Sales`}
            value={stats.dailySales}
            icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
            color="bg-green-500"
          />
          <StatsCard
            title="Active Orders"
            value={stats.activeOrders}
            icon={<ShoppingCartIcon className="h-6 w-6 text-white" />}
            color="bg-blue-500"
          />
          <StatsCard
            title={`${
              period === "day"
                ? "Today's"
                : period === "week"
                ? "Weekly"
                : "Monthly"
            } Customers`}
            value={stats.customers}
            icon={<UserGroupIcon className="h-6 w-6 text-white" />}
            color="bg-purple-500"
          />
          <StatsCard
            title="Avg. Preparation Time"
            value={stats.avgTime}
            icon={<ClockIcon className="h-6 w-6 text-white" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Recent orders and popular items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Active Orders
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading.orders ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : recentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Table {order.table?.number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAgo(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No active orders at the moment.
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Popular Items
          </h2>
          <div className="bg-white rounded-lg shadow p-6">
            {loading.popularItems ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : popularItems.length > 0 ? (
              popularItems.map((item) => (
                <div key={item.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500 text-sm">
                      {item.count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                No data available for popular items.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
