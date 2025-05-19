import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderAPI } from "../../services/api";
import { type Order, OrderStatus } from "../../types/order";
import { useTranslation } from "react-i18next";
import socketService from "../../services/socket";
import { formatTimeAgo, formatCurrency } from "../../utils/formatters";
import useAuthStore from "../../store/authStore";

const MobileOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchOrders();

    // Set up socket listeners for real-time updates
    socketService.on("order:created", (newOrder) => {
      if (newOrder.waiterId === user?.id) {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      }
    });

    socketService.on("order:updated", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    socketService.on("order:status", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    return () => {
      socketService.off("order:created");
      socketService.off("order:updated");
      socketService.off("order:status");
    };
  }, [user?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getOrders();
      // Filter orders for the current waiter
      const filteredOrders = data.filter(
        (order: Order) => order.waiterId === user?.id
      );
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    navigate(`/mobile/orders/${order.id}`);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PREPARING:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.READY:
        return "bg-green-100 text-green-800";
      case OrderStatus.SERVED:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "active") {
      return (
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.PREPARING ||
        order.status === OrderStatus.READY
      );
    } else if (statusFilter === "completed") {
      return (
        order.status === OrderStatus.SERVED ||
        order.status === OrderStatus.COMPLETED
      );
    }
    return true;
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex overflow-x-auto pb-2">
        <button
          className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
            statusFilter === "active"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={() => setStatusFilter("active")}
        >
          {t("orders.active")}
        </button>
        <button
          className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
            statusFilter === "completed"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={() => setStatusFilter("completed")}
        >
          {t("orders.completed")}
        </button>
        <button
          className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
            statusFilter === "all"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border border-gray-300"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          {t("orders.all")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow overflow-hidden"
              onClick={() => handleOrderClick(order)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("orders.tableNumber", { number: order.table.number })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {t(`orders.status.${order.status}`)}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {order.items.length} {t("orders.items")} ·{" "}
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(new Date(order.createdAt))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">{t("orders.noOrders")}</p>
        </div>
      )}

      <div className="fixed bottom-20 right-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg"
          onClick={() => navigate("/mobile/tables")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MobileOrders;
