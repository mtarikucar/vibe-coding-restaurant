import React, { useState, useEffect } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { orderAPI } from"../../services/api";
import {type Order, OrderStatus, OrderItemStatus } from"../../types/order";
import { useTranslation } from"react-i18next";
import {
 formatTimeAgo,
 formatCurrency,
 formatDateTime,
} from"../../utils/formatters";
import socketService from"../../services/socket";
import { useToast } from"../../components/common/ToastProvider";

const MobileOrderDetail: React.FC = () => {
 const { orderId } = useParams<{ orderId: string }>();
 const [order, setOrder] = useState<Order | null>(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();
 const { t } = useTranslation();
 const { success, error } = useToast();

 useEffect(() => {
  if (orderId) {
   fetchOrderDetails();

   // Set up socket listeners for real-time updates
   socketService.on("order:updated", (updatedOrder) => {
    if (updatedOrder.id === orderId) {
     setOrder(updatedOrder);
    }
   });

   socketService.on("order:status", (updatedOrder) => {
    if (updatedOrder.id === orderId) {
     setOrder(updatedOrder);
    }
   });

   socketService.on("order:item:status", (updatedItem) => {
    setOrder((prevOrder) => {
     if (!prevOrder) return null;

     const updatedItems = prevOrder.items.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
     );

     return {
      ...prevOrder,
      items: updatedItems,
     };
    });
   });

   return () => {
    socketService.off("order:updated");
    socketService.off("order:status");
    socketService.off("order:item:status");
   };
  }
 }, [orderId]);

 const fetchOrderDetails = async () => {
  setLoading(true);
  try {
   const data = await orderAPI.getOrder(orderId!);
   setOrder(data);
  } catch (err) {
   console.error("Error fetching order details:", err);
   error(t("orders.fetchError"));
  } finally {
   setLoading(false);
  }
 };

 const handleUpdateOrderStatus = async (status: OrderStatus) => {
  try {
   await orderAPI.updateOrderStatus(orderId!, status);
   success(t("orders.statusUpdateSuccess"));
   fetchOrderDetails();
  } catch (err) {
   console.error("Error updating order status:", err);
   error(t("orders.statusUpdateError"));
  }
 };

 const handleUpdateItemStatus = async (
  itemId: string,
  status: OrderItemStatus
 ) => {
  try {
   await orderAPI.updateOrderItemStatus(orderId!, itemId, status);
   success(t("orders.itemStatusUpdateSuccess"));
   fetchOrderDetails();
  } catch (err) {
   console.error("Error updating item status:", err);
   error(t("orders.itemStatusUpdateError"));
  }
 };

 const getStatusColor = (status: OrderStatus | OrderItemStatus) => {
  switch (status) {
   case OrderStatus.PENDING:
   case OrderItemStatus.PENDING:
    return"bg-yellow-100 text-yellow-800";
   case OrderStatus.PREPARING:
   case OrderItemStatus.PREPARING:
    return"bg-blue-100 text-blue-800";
   case OrderStatus.READY:
   case OrderItemStatus.READY:
    return"bg-green-100 text-green-800";
   case OrderStatus.SERVED:
   case OrderItemStatus.SERVED:
    return"bg-purple-100 text-purple-800";
   case OrderStatus.COMPLETED:
    return"bg-gray-100 text-gray-800";
   case OrderStatus.CANCELLED:
   case OrderItemStatus.CANCELLED:
    return"bg-red-100 text-red-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 if (loading) {
  return (
   <div className="flex justify-center items-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
   </div>
  );
 }

 if (!order) {
  return (
   <div className="p-4">
    <div className="text-center py-12">
     <p className="text-gray-500">{t("orders.notFound")}</p>
    </div>
   </div>
  );
 }

 return (
  <div className="p-4 pb-20">
   <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div className="p-6">
     <div className="flex justify-between items-start">
      <div>
       <h2 className="text-2xl font-semibold text-gray-900">
        {order.orderNumber}
       </h2>
       <p className="text-sm text-gray-500 mt-1">
        {t("orders.tableNumber", { number: order.table.number })}
       </p>
       <p className="text-sm text-gray-500">
        {formatDateTime(new Date(order.createdAt))}
       </p>
      </div>
      <span
       className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
        order.status
       )}`}
      >
       {t(`orders.status.${order.status}`)}
      </span>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div className="p-4 border-b border-gray-200">
     <h3 className="text-lg font-medium text-gray-900">
      {t("orders.items")}
     </h3>
    </div>
    <div className="divide-y divide-gray-200">
     {order.items.map((item) => (
      <div key={item.id} className="p-4">
       <div className="flex justify-between items-start">
        <div>
         <div className="flex items-center">
          <span className="font-medium text-gray-900">
           {item.quantity}x
          </span>
          <h4 className="ml-2 font-medium text-gray-900">
           {item.menuItem.name}
          </h4>
         </div>
         <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(item.price)} per item
         </p>
         {item.notes && (
          <p className="text-sm text-gray-500 mt-1 italic">
           {item.notes}
          </p>
         )}
        </div>
        <span
         className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
          item.status
         )}`}
        >
         {t(`orders.itemStatus.${item.status}`)}
        </span>
       </div>

       {/* Item actions based on status */}
       {item.status === OrderItemStatus.PENDING && (
        <div className="mt-2 flex space-x-2">
         <button
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
          onClick={() =>
           handleUpdateItemStatus(item.id, OrderItemStatus.PREPARING)
          }
         >
          {t("orders.markPreparing")}
         </button>
        </div>
       )}

       {item.status === OrderItemStatus.READY && (
        <div className="mt-2 flex space-x-2">
         <button
          className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md"
          onClick={() =>
           handleUpdateItemStatus(item.id, OrderItemStatus.SERVED)
          }
         >
          {t("orders.markServed")}
         </button>
        </div>
       )}
      </div>
     ))}
    </div>
    <div className="p-4 bg-gray-50 border-t border-gray-200">
     <div className="flex justify-between items-center">
      <span className="font-medium text-gray-900">
       {t("orders.total")}
      </span>
      <span className="font-bold text-gray-900">
       {formatCurrency(order.totalAmount)}
      </span>
     </div>
    </div>
   </div>

   {/* Order actions based on status */}
   <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-4">
     <h3 className="text-lg font-medium text-gray-900 mb-4">
      {t("orders.actions")}
     </h3>
     <div className="space-y-3">
      {order.status === OrderStatus.PENDING && (
       <button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
        onClick={() => handleUpdateOrderStatus(OrderStatus.PREPARING)}
       >
        {t("orders.markPreparing")}
       </button>
      )}

      {order.status === OrderStatus.PREPARING && (
       <button
        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium"
        onClick={() => handleUpdateOrderStatus(OrderStatus.READY)}
       >
        {t("orders.markReady")}
       </button>
      )}

      {order.status === OrderStatus.READY && (
       <button
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium"
        onClick={() => handleUpdateOrderStatus(OrderStatus.SERVED)}
       >
        {t("orders.markServed")}
       </button>
      )}

      {order.status === OrderStatus.SERVED && (
       <button
        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
        onClick={() => handleUpdateOrderStatus(OrderStatus.COMPLETED)}
       >
        {t("orders.markCompleted")}
       </button>
      )}

      {(order.status === OrderStatus.PENDING ||
       order.status === OrderStatus.PREPARING) && (
       <button
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
        onClick={() => handleUpdateOrderStatus(OrderStatus.CANCELLED)}
       >
        {t("orders.cancel")}
       </button>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};

export default MobileOrderDetail;
