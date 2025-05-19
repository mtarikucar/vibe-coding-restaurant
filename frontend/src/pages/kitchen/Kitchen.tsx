import { useState, useEffect } from "react";
import {
  CheckIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { kitchenAPI, orderAPI } from "../../services/api";
import { formatTimeAgo } from "../../utils/formatters";
import socketService from "../../services/socket";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/common/ToastProvider";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  table: {
    id: string;
    number: number;
  };
  items: OrderItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
  waiter: {
    id: string;
    fullName: string;
  };
}

const Kitchen = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { error: toastError, success } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Önce orderAPI ile tüm siparişleri alalım
      const allOrders = await orderAPI.getOrders();

      // Sadece bekleyen veya hazırlanan siparişleri filtreleyelim
      const kitchenOrders = allOrders.filter(
        (order) => order.status === "pending" || order.status === "preparing"
      );

      // Masa numaralarını ekleyelim
      const ordersWithDetails = kitchenOrders;

      setOrders(ordersWithDetails);

      if (ordersWithDetails.length === 0) {
        console.log("No active orders found for kitchen");
      } else {
        console.log(
          `Found ${ordersWithDetails.length} active orders for kitchen`
        );
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
      toastError(t("kitchen.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Connect to socket for real-time updates with user info
    if (user) {
      socketService.connect(user.id, user.tenantId);
    } else {
      socketService.connect();
    }

    // Listen for order updates
    socketService.on("order:created", (newOrder) => {
      if (newOrder.status === "pending" || newOrder.status === "preparing") {
        setOrders((prevOrders) => {
          // Check if order already exists
          if (prevOrders.some((o) => o.id === newOrder.id)) {
            return prevOrders;
          }
          return [...prevOrders, newOrder];
        });
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
      if (
        updatedOrder.status !== "pending" &&
        updatedOrder.status !== "preparing"
      ) {
        // Remove orders that are no longer active
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== updatedOrder.id)
        );
      } else {
        // Update the order status
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      }
    });

    socketService.on("order:item:status", (updatedItem) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          // Find the order that contains this item
          const orderContainsItem = order.items.some(
            (item) => item.id === updatedItem.id
          );

          if (orderContainsItem) {
            // Update the item in the order
            const updatedItems = order.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            );

            // Check if all items are in the same status
            const allItemsStatus = checkAllItemsStatus(updatedItems);

            return {
              ...order,
              items: updatedItems,
              status: allItemsStatus || order.status,
            };
          }

          return order;
        })
      );
    });

    return () => {
      // Clean up socket listeners
      socketService.off("order:created", () => {});
      socketService.off("order:updated", () => {});
      socketService.off("order:status", () => {});
      socketService.off("order:item:status", () => {});
    };
  }, [user]);

  const handleItemStatusChange = async (
    orderId: string,
    itemId: string,
    newStatus: string
  ) => {
    try {
      // orderAPI kullanarak öğe durumunu güncelleyelim
      await orderAPI.updateOrderItemStatus(orderId, itemId, newStatus);
      success(t("orders.itemStatusUpdateSuccess"));

      // Arayüzü hemen güncelleyelim (socket yanıtını beklemeden)
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, status: newStatus } : item
              ),
            };
          }
          return order;
        })
      );

      // Tüm öğeler hazırsa, siparişin durumunu da güncelleyelim
      const updatedOrder = orders.find((order) => order.id === orderId);
      if (updatedOrder) {
        const allItemsReady = updatedOrder.items.every(
          (item) => (item.id === itemId ? newStatus : item.status) === "ready"
        );

        if (allItemsReady && updatedOrder.status !== "ready") {
          handleOrderStatusChange(orderId, "ready");
        }
      }
    } catch (err) {
      console.error("Error updating item status:", err);
      setError("Failed to update item status. Please try again.");
      toastError(t("orders.itemStatusUpdateError"));
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      // orderAPI kullanarak sipariş durumunu güncelleyelim
      await orderAPI.updateOrderStatus(orderId, newStatus);
      success(t("orders.statusUpdateSuccess"));

      // Arayüzü hemen güncelleyelim (socket yanıtını beklemeden)
      if (
        newStatus === "ready" ||
        newStatus === "served" ||
        newStatus === "completed"
      ) {
        // Bu durumlar için siparişi listeden kaldıralım
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== orderId)
        );
      } else {
        // Diğer durumlar için sadece durumu güncelleyelim
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status. Please try again.");
      toastError(t("orders.statusUpdateError"));
    }
  };

  const checkAllItemsStatus = (items: OrderItem[]): string | null => {
    if (items.length === 0) return null;

    const firstStatus = items[0].status;
    const allSameStatus = items.every((item) => item.status === firstStatus);

    return allSameStatus ? firstStatus : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter orders that are pending or preparing
  const activeOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "preparing"
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("kitchen.title")}
        </h2>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white flex items-center"
          title={t("common.refresh")}
        >
          <ArrowPathIcon className="h-5 w-5 mr-1" />
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="bg-blue-500 text-white px-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {t("orders.orderNumber")}: {order.orderNumber}
                    </span>
                    <span className="ml-2 text-sm">
                      {order.table
                        ? t("tables.tableNumber", {
                            number: order.table.number,
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {formatTimeAgo(order.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-700">
                    {t(`orders.status.${order.status}`)}
                  </span>
                  {order.waiter && (
                    <span className="ml-2 text-xs">
                      {t("orders.waiter")}: {order.waiter.fullName}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="py-3 flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {item.quantity}x {item.menuItem?.name}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-sm text-gray-500">
                            {t("orders.notes")}: {item.notes}
                          </p>
                        )}
                        <span
                          className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {t(`orders.itemStatus.${item.status}`)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {item.status === "pending" && (
                          <button
                            onClick={() =>
                              handleItemStatusChange(
                                order.id,
                                item.id,
                                "preparing"
                              )
                            }
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center"
                            title={t("kitchen.markAsPreparing")}
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {t("kitchen.markAsPreparing")}
                          </button>
                        )}
                        {(item.status === "pending" ||
                          item.status === "preparing") && (
                          <button
                            onClick={() =>
                              handleItemStatusChange(order.id, item.id, "ready")
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center"
                            title={t("kitchen.markAsReady")}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            {t("kitchen.markAsReady")}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sipariş durumu butonları */}
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                {order.status === "pending" && (
                  <button
                    onClick={() =>
                      handleOrderStatusChange(order.id, "preparing")
                    }
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
                  >
                    {t("orders.markPreparing")}
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => handleOrderStatusChange(order.id, "ready")}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
                  >
                    {t("orders.markReady")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">{t("kitchen.noOrders")}</p>
        </div>
      )}
    </div>
  );
};

export default Kitchen;
