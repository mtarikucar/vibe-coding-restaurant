import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { orderAPI } from "../../services/api";
import { type Order, OrderStatus } from "../../types/order";
import { formatCurrency, formatTimeAgo } from "../../utils/formatters";
import { useToast } from "../../components/common/ToastProvider";
import usePerformanceMonitoring from "../../hooks/usePerformanceMonitoring";
import QRCodeGenerator from "../../components/menu/QRCodeGenerator";

const Orders = () => {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Initialize performance monitoring
  const performanceMonitoring = usePerformanceMonitoring("Orders", {
    trackMount: true,
    trackRender: false, // Disable render tracking to reduce unnecessary renders
    metadata: { component: "Orders" },
  });

  // Memoize the fetchOrders function to prevent infinite loops
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Use a local reference to the trackAsyncOperation function
      const data = await performanceMonitoring.trackAsyncOperation(
        "fetchOrders",
        () => orderAPI.getOrders()
      );
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      error(t("orders.fetchError", "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, [error, t, performanceMonitoring]); // Include performanceMonitoring in dependencies

  // Only fetch orders on mount
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.table && order.table.number.toString().includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PREPARING:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.READY:
        return "bg-orange-100 text-orange-800";
      case OrderStatus.SERVED:
        return "bg-green-100 text-green-800";
      case OrderStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleNewOrder = () => {
    navigate("/app/orders/new"); // Navigate directly to new order form
  };

  const handleRefresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleShowQRCode = useCallback(() => {
    setShowQRModal(true);
  }, []);

  const handleCloseQRModal = useCallback(() => {
    setShowQRModal(false);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("orders.title", "Order Management")}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center"
            title={t("common.refresh", "Refresh")}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleShowQRCode}
            className="bg-forest-500 hover:bg-forest-600 text-white px-3 py-2 rounded-md flex items-center"
            title={t("menu.qrCode", "Menu QR Code")}
          >
            <QrCodeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNewOrder}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t("orders.newOrder", "New Order")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("orders.status", "Status")}
              </label>
              <select
                id="status"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">
                  {t("orders.allStatuses", "All Statuses")}
                </option>
                <option value={OrderStatus.PENDING}>
                  {t("orders.statuses.pending", "Pending")}
                </option>
                <option value={OrderStatus.PREPARING}>
                  {t("orders.statuses.preparing", "Preparing")}
                </option>
                <option value={OrderStatus.READY}>
                  {t("orders.statuses.ready", "Ready")}
                </option>
                <option value={OrderStatus.SERVED}>
                  {t("orders.statuses.served", "Served")}
                </option>
                <option value={OrderStatus.COMPLETED}>
                  {t("orders.statuses.completed", "Completed")}
                </option>
                <option value={OrderStatus.CANCELLED}>
                  {t("orders.statuses.cancelled", "Cancelled")}
                </option>
              </select>
            </div>
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("common.search", "Search")}
              </label>
              <input
                type="text"
                id="search"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t(
                  "orders.searchPlaceholder",
                  "Search by order # or table..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.orderNumber", "Order #")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.table", "Table")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.items", "Items")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.total", "Total")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("orders.time", "Time")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {t("orders.tableNumber", "Table")}{" "}
                        {order.table?.number || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0}{" "}
                        {order.items?.length === 1
                          ? t("orders.item", "item")
                          : t("orders.items", "items")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/app/orders/${order.id}`)}
                        className="text-primary-600 hover:text-primary-900"
                        title={t("common.view", "View")}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {t("orders.noOrders", "No orders found.")}
            </div>
          )}
        </div>
      )}

      {/* QR Code Generator Modal */}
      <QRCodeGenerator isOpen={showQRModal} onClose={handleCloseQRModal} />
    </div>
  );
};

export default Orders;
