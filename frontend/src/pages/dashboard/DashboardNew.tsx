import { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
import {
 CurrencyDollarIcon,
 ShoppingCartIcon,
 UserGroupIcon,
 ClockIcon,
 ArrowPathIcon,
 ExclamationCircleIcon,
 ChartBarIcon,
 ChartPieIcon,
} from"@heroicons/react/24/outline";
import usePerformanceMonitoring from"../../hooks/usePerformanceMonitoring";
import { dashboardAPI } from"../../services/api";
import {
 formatCurrency,
 formatDate,
 formatTimeAgo,
 formatDateFns,
 formatNumber,
 formatPercentage,
 getCurrencySymbol,
} from"../../utils/formatters";
import { Card, Button } from"../../components/ui";
import SalesChart from"../../components/dashboard/SalesChart";
import TopSellingItems from"../../components/dashboard/TopSellingItems";
import DateRangeFilter from"../../components/dashboard/DateRangeFilter";

// Stats card component
const StatsCard = ({
 title,
 value,
 icon,
 color,
 trend,
 trendValue,
}: {
 title: string;
 value: string;
 icon: React.ReactNode;
 color: string;
 trend?:"up" | "down" | "neutral";
 trendValue?: string;
}) => {
 // Get the background color for the icon based on the color prop
 const getIconBgColor = () => {
  switch (color) {
   case"green":
    return"bg-success-500";
   case"blue":
    return"bg-primary-500";
   case"purple":
    return"bg-purple-500";
   case"orange":
    return"bg-warning-500";
   default:
    return"bg-gray-500";
  }
 };

 // Get the trend icon and color
 const getTrendDisplay = () => {
  if (!trend || !trendValue) return null;

  const trendIcon =
   trend ==="up" ? (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
     <path
      fillRule="evenodd"
      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
      clipRule="evenodd"
     ></path>
    </svg>
   ) : trend ==="down" ? (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
     <path
      fillRule="evenodd"
      d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
      clipRule="evenodd"
     ></path>
    </svg>
   ) : null;

  const trendColor =
   trend ==="up"
    ?"text-success-600"
    : trend ==="down"
    ?"text-danger-600"
    :"text-gray-600";

  return (
   <div
    className={`flex items-center text-xs font-medium ${trendColor} mt-1`}
   >
    {trendIcon}
    <span className="ml-1">{trendValue}</span>
   </div>
  );
 };

 return (
  <Card
   variant="default"
   className="transition-all duration-300 hover:shadow-soft"
  >
   <div className="flex items-center">
    <div className={`rounded-full p-3 ${getIconBgColor()}`}>{icon}</div>
    <div className="ml-4">
     <p className="text-gray-500 text-sm font-medium">{title}</p>
     <p className="text-2xl font-semibold">{value}</p>
     {getTrendDisplay()}
    </div>
   </div>
  </Card>
 );
};

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
 const [period, setPeriod] = useState<"day" |"week" | "month">("day");
 const [startDate, setStartDate] = useState<Date>(new Date());
 const [endDate, setEndDate] = useState<Date>(new Date());
 const [useCustomDateRange, setUseCustomDateRange] = useState(false);
 const [loading, setLoading] = useState({
  stats: false,
  orders: false,
  popularItems: false,
  salesChart: false,
  categorySales: false,
 });
 const [error, setError] = useState<string | null>(null);

 const [stats, setStats] = useState({
  dailySales:"0",
  salesTrend: {
   trend:"neutral" as "up" | "down" | "neutral",
   percentage: 0,
  },
  activeOrders:"0",
  customers:"0",
  customersTrend: {
   trend:"neutral" as "up" | "down" | "neutral",
   percentage: 0,
  },
  avgTime:"0",
  avgTimeTrend: {
   trend:"neutral" as "up" | "down" | "neutral",
   percentage: 0,
  },
 });

 const [recentOrders, setRecentOrders] = useState<Order[]>([]);
 const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
 const [salesData, setSalesData] = useState<any[]>([]);
 const [categorySales, setCategorySales] = useState<any[]>([]);

 // Initialize performance monitoring
 const { trackAsyncOperation } = usePerformanceMonitoring("Dashboard", {
  trackMount: true,
  trackRender: true,
  metadata: { component:"Dashboard" },
 });

 const fetchDashboardData = async () => {
  setError(null);

  try {
   await trackAsyncOperation("fetchDashboardData", async () => {
    // Fetch active orders - this endpoint is accessible to all roles
    setLoading((prev) => ({ ...prev, orders: true }));
    const ordersData = await trackAsyncOperation("fetchActiveOrders", () =>
     dashboardAPI.getActiveOrders()
    );

    setRecentOrders(ordersData);
    setLoading((prev) => ({ ...prev, orders: false }));

    try {
     // Fetch stats - this endpoint is restricted to admin role
     setLoading((prev) => ({ ...prev, stats: true }));
     const statsData = await trackAsyncOperation(
     "fetchStats",
      () => dashboardAPI.getStats(period),
      { period }
     );

     setStats({
      dailySales: formatCurrency(statsData.totalSales || 0),
      salesTrend: statsData.salesTrend || {
       trend:"neutral",
       percentage: 0,
      },
      activeOrders: formatNumber(statsData.activeOrdersCount || 0),
      customers: formatNumber(statsData.orderCount || 0),
      customersTrend: statsData.orderCountTrend || {
       trend:"neutral",
       percentage: 0,
      },
      avgTime: statsData.avgPrepTime
       ? `${formatNumber(statsData.avgPrepTime)} ${t(
        "common.time.minutes"
        )}`
       :"0 min",
      avgTimeTrend: statsData.prepTimeTrend || {
       trend:"neutral",
       percentage: 0,
      },
     });
    } catch (statsError) {
     console.warn(
     "Could not fetch stats data, user may not have admin role:",
      statsError
     );
     // Set default values for stats
     setStats({
      dailySales: formatCurrency(0),
      salesTrend: {
       trend:"neutral",
       percentage: 0,
      },
      activeOrders: formatNumber(ordersData.length || 0),
      customers: formatNumber(0),
      customersTrend: {
       trend:"neutral",
       percentage: 0,
      },
      avgTime:"0 min",
      avgTimeTrend: {
       trend:"neutral",
       percentage: 0,
      },
     });
    } finally {
     setLoading((prev) => ({ ...prev, stats: false }));
    }

    try {
     // Fetch popular items - this endpoint is restricted to admin role
     setLoading((prev) => ({ ...prev, popularItems: true }));
     const popularItemsData = await trackAsyncOperation(
     "fetchPopularItems",
      () => dashboardAPI.getPopularItems(5),
      { limit: 5 }
     );

     setPopularItems(popularItemsData);
    } catch (popularItemsError) {
     console.warn(
     "Could not fetch popular items, user may not have admin role:",
      popularItemsError
     );
     // Set empty popular items
     setPopularItems([]);
    } finally {
     setLoading((prev) => ({ ...prev, popularItems: false }));
    }

    try {
     // Fetch sales data for chart
     setLoading((prev) => ({ ...prev, salesChart: true }));
     let salesChartData;

     if (useCustomDateRange) {
      const formattedStartDate = formatDateFns(startDate,"yyyy-MM-dd");
      const formattedEndDate = formatDateFns(endDate,"yyyy-MM-dd");
      salesChartData = await trackAsyncOperation(
      "fetchSalesData",
       () =>
        dashboardAPI.getSales(
         period,
         formattedStartDate,
         formattedEndDate
        ),
       {
        period,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
       }
      );
     } else {
      salesChartData = await trackAsyncOperation(
      "fetchSalesData",
       () => dashboardAPI.getSales(period),
       { period }
      );
     }

     setSalesData(salesChartData);
    } catch (salesChartError) {
     console.warn(
     "Could not fetch sales chart data, user may not have admin role:",
      salesChartError
     );
     // Set empty sales data
     setSalesData([]);
    } finally {
     setLoading((prev) => ({ ...prev, salesChart: false }));
    }

    try {
     // Fetch category sales data
     setLoading((prev) => ({ ...prev, categorySales: true }));
     const categorySalesData = await trackAsyncOperation(
     "fetchCategorySales",
      () => dashboardAPI.getCategorySales(period),
      { period }
     );

     setCategorySales(categorySalesData);
    } catch (categorySalesError) {
     console.warn(
     "Could not fetch category sales data, user may not have admin role:",
      categorySalesError
     );
     // Set empty category sales data
     setCategorySales([]);
    } finally {
     setLoading((prev) => ({ ...prev, categorySales: false }));
    }
   });
  } catch (err) {
   console.error("Error fetching dashboard data:", err);
   setError("Failed to load dashboard data. Please try again.");
   setLoading({
    stats: false,
    orders: false,
    popularItems: false,
    salesChart: false,
    categorySales: false,
   });
  }
 };

 useEffect(() => {
  fetchDashboardData();
 }, [period]);

 const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
   case"pending":
    return"text-gray-600 bg-gray-100";
   case"preparing":
    return"text-yellow-600 bg-yellow-100";
   case"ready":
    return"text-orange-600 bg-orange-100";
   case"served":
    return"text-blue-600 bg-blue-100";
   case"completed":
    return"text-green-600 bg-green-100";
   case"cancelled":
    return"text-red-600 bg-red-100";
   default:
    return"text-gray-600 bg-gray-100";
  }
 };

 const handleRefresh = () => {
  fetchDashboardData();
 };

 const handlePeriodChange = (newPeriod:"day" | "week" | "month") => {
  setPeriod(newPeriod);
  setUseCustomDateRange(false);
 };

 const handleDateRangeChange = (start: Date, end: Date) => {
  setStartDate(start);
  setEndDate(end);
  setUseCustomDateRange(true);
  fetchDashboardData();
 };

 return (
  <div>
   {/* Header with period selector and refresh button */}
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800 animate-fadeIn">
     {t("dashboard.title")}
    </h2>
    <div className="flex items-center space-x-4 animate-fadeIn">
     <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      title={t("common.refresh")}
      leftIcon={<ArrowPathIcon className="h-5 w-5" />}
     />
    </div>
   </div>

   {/* Date Range Filter */}
   <DateRangeFilter
    onDateRangeChange={handleDateRangeChange}
    onPeriodChange={handlePeriodChange}
    period={period}
   />

   {/* Error message */}
   {error && (
    <Card
     variant="default"
     className="mb-6 border-l-4 border-danger-500 animate-fadeIn"
    >
     <div className="flex items-start">
      <ExclamationCircleIcon className="h-5 w-5 text-danger-500 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
       <p className="text-danger-700">{error}</p>
       <Button
        onClick={handleRefresh}
        variant="danger"
        size="sm"
        className="mt-2"
       >
        {t("common.tryAgain")}
       </Button>
      </div>
     </div>
    </Card>
   )}

   {/* Stats cards */}
   <div className="mb-8 animate-fadeIn">
    <div className="flex justify-between items-center mb-4">
     <h2 className="text-xl font-bold text-gray-800">
      {t("dashboard.overview","Overview")}
     </h2>
     {stats.dailySales === formatCurrency(0) &&
      stats.customers ==="0" && (
       <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-md">
        {t(
        "dashboard.adminOnlyStats",
        "Some statistics are only visible to administrators"
        )}
       </div>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <StatsCard
      title={`${
       period ==="day"
        ? t("dashboard.periods.daily","Daily")
        : period ==="week"
        ? t("dashboard.periods.weekly","Weekly")
        : t("dashboard.periods.monthly","Monthly")
      } ${t("dashboard.sales","Sales")}`}
      value={stats.dailySales}
      icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
      color="green"
      trend={stats.salesTrend.trend}
      trendValue={`${stats.salesTrend.percentage}% ${t(
      "dashboard.vsLastPeriod",
      "vs last period"
      )}`}
     />
     <StatsCard
      title={t("dashboard.activeOrders","Active Orders")}
      value={stats.activeOrders}
      icon={<ShoppingCartIcon className="h-6 w-6 text-white" />}
      color="blue"
     />
     <StatsCard
      title={`${
       period ==="day"
        ? t("dashboard.periods.today","Today's")
        : period ==="week"
        ? t("dashboard.periods.weekly","Weekly")
        : t("dashboard.periods.monthly","Monthly")
      } ${t("dashboard.customers","Customers")}`}
      value={stats.customers}
      icon={<UserGroupIcon className="h-6 w-6 text-white" />}
      color="purple"
      trend={stats.customersTrend.trend}
      trendValue={`${stats.customersTrend.percentage}% ${t(
      "dashboard.vsLastPeriod",
      "vs last period"
      )}`}
     />
     <StatsCard
      title={t("dashboard.avgPrepTime","Avg. Preparation Time")}
      value={stats.avgTime}
      icon={<ClockIcon className="h-6 w-6 text-white" />}
      color="orange"
      trend={stats.avgTimeTrend.trend}
      trendValue={`${stats.avgTimeTrend.percentage}% ${t(
      "dashboard.vsLastPeriod",
      "vs last period"
      )}`}
     />
    </div>
   </div>

   {/* Sales Chart */}
   <div className="mb-8 animate-fadeIn">
    <SalesChart period={period} />
   </div>

   {/* Data Visualization Section */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    {/* Top Selling Items Chart */}
    <div className="animate-fadeIn">
     <TopSellingItems limit={5} />
    </div>

    {/* Popular Items List */}
    <div className="animate-fadeIn">
     <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">
       {t("dashboard.popularItems","Popular Items")}
      </h2>
      <Button
       variant="ghost"
       size="sm"
       as="link"
       to="/app/reports"
       rightIcon={<span className="text-xs">→</span>}
      >
       {t("dashboard.viewReports","View Reports")}
      </Button>
     </div>

     <Card variant="default">
      {loading.popularItems ? (
       <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
       </div>
      ) : popularItems.length > 0 ? (
       <div className="space-y-4 p-4">
        {popularItems.map((item) => (
         <div key={item.id}>
          <div className="flex justify-between mb-1">
           <span className="text-gray-700 font-medium">
            {item.name}
           </span>
           <span className="text-gray-500 text-sm font-medium">
            {item.count} {t("dashboard.orders","orders")}
           </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
           <div
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${item.percentage}%` }}
           ></div>
          </div>
         </div>
        ))}
       </div>
      ) : (
       <div className="text-center text-gray-500 p-8">
        {stats.dailySales === formatCurrency(0) &&
        stats.customers ==="0" ? (
         <div>
          <p>
           {t(
           "dashboard.adminOnlyData",
           "This data is only available to administrators."
           )}
          </p>
          <p className="mt-2 text-sm">
           {t(
           "dashboard.contactAdmin",
           "Please contact your administrator for access."
           )}
          </p>
         </div>
        ) : (
         t(
         "dashboard.noPopularItems",
         "No data available for popular items."
         )
        )}
       </div>
      )}
     </Card>
    </div>
   </div>

   {/* Recent orders */}
   <div className="animate-fadeIn mb-8">
    <div className="flex justify-between items-center mb-4">
     <h2 className="text-xl font-bold text-gray-800">
      {t("dashboard.activeOrders","Active Orders")}
     </h2>
     <Button
      variant="ghost"
      size="sm"
      as="link"
      to="/app/orders"
      rightIcon={<span className="text-xs">→</span>}
     >
      {t("common.viewAll","View All")}
     </Button>
    </div>

    <Card variant="default" className="overflow-hidden">
     {loading.orders ? (
      <div className="flex justify-center items-center p-8">
       <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
     ) : recentOrders.length > 0 ? (
      <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
         <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.orderNumber","Order #")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.table","Table")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.items","Items")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.total","Total")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.status","Status")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           {t("orders.time","Time")}
          </th>
         </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
         {recentOrders.map((order) => (
          <tr
           key={order.id}
           className="hover:bg-gray-50 transition-colors"
          >
           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {order.orderNumber}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {t("orders.tableNumber","Table")}{" "}
            {order.table?.number ||"N/A"}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {order.items?.length || 0}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {formatCurrency(order.totalAmount || 0)}
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <span
             className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              order.status
             )}`}
            >
             {t(
              `orders.statuses.${order.status}`,
              order.status.charAt(0).toUpperCase() +
               order.status.slice(1)
             )}
            </span>
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatTimeAgo(order.createdAt)}
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     ) : (
      <div className="text-center text-gray-500 p-8">
       {t("dashboard.noActiveOrders","No active orders at the moment.")}
      </div>
     )}
    </Card>
   </div>
  </div>
 );
};

export default Dashboard;
