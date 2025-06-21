import { useState, useEffect, useCallback } from"react";
import { useNavigate } from"react-router-dom";
import {
 PlusIcon,
 EyeIcon,
 ArrowPathIcon,
 QrCodeIcon,
 MagnifyingGlassIcon,
} from"@heroicons/react/24/outline";
import { useTranslation } from"react-i18next";
import { orderAPI } from"../../services/api";
import { type Order, OrderStatus } from"../../types/order";
import { formatCurrency, formatTimeAgo } from"../../utils/formatters";
import { useToast } from"../../components/common/ToastProvider";
import usePerformanceMonitoring from"../../hooks/usePerformanceMonitoring";
import QRCodeGenerator from"../../components/menu/QRCodeGenerator";
import { Button, Input, Select } from"../../components/ui";

const Orders = () => {
 const { t } = useTranslation();
 const { error } = useToast();
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
  metadata: { component:"Orders" },
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
   error(t("orders.fetchError","Failed to load orders"));
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
   statusFilter ==="all" || order.status === statusFilter;
  const matchesSearch =
   searchQuery ==="" ||
   order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
   (order.table && order.table.number.toString().includes(searchQuery)) ||
   (order.waiter &&
    order.waiter.fullName
     .toLowerCase()
     .includes(searchQuery.toLowerCase()));
  return matchesStatus && matchesSearch;
 });

 const getStatusColor = (status: string) => {
  switch (status) {
   case OrderStatus.PENDING:
    return"bg-yellow-100 text-yellow-800 border border-yellow-200";
   case OrderStatus.PREPARING:
    return"bg-blue-100 text-blue-800 border border-blue-200";
   case OrderStatus.READY:
    return"bg-orange-100 text-orange-800 border border-orange-200";
   case OrderStatus.SERVED:
    return"bg-green-100 text-green-800 border border-green-200";
   case OrderStatus.COMPLETED:
    return"bg-primary-100 text-primary-800 border border-primary-200";
   case OrderStatus.CANCELLED:
    return"bg-red-100 text-red-800 border border-red-200";
   default:
    return"bg-neutral-100 text-neutral-800 border border-neutral-200";
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
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
    <div>
     <h1 className="text-3xl font-bold text-primary-900">
      {t("orders.title","Orders")}
     </h1>
     <p className="text-neutral-600 mt-1">
      {t("orders.subtitle","Manage and track all restaurant orders")}
     </p>
    </div>
    <div className="flex flex-wrap gap-3">
     <Button
      variant="outline"
      onClick={handleRefresh}
      leftIcon={<ArrowPathIcon className="h-4 w-4" />}
      disabled={loading}
     >
      {t("common.refresh","Refresh")}
     </Button>
     <Button
      variant="outline"
      onClick={handleShowQRCode}
      leftIcon={<QrCodeIcon className="h-4 w-4" />}
     >
      {t("orders.qrCode","QR Menu")}
     </Button>
     <Button
      variant="primary"
      onClick={handleNewOrder}
      leftIcon={<PlusIcon className="h-4 w-4" />}
     >
      {t("orders.newOrder","New Order")}
     </Button>
    </div>
   </div>

   {/* Filters */}
   <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
    <div className="flex flex-col lg:flex-row gap-4">
     <div className="flex-1">
      <Input
       placeholder={t(
       "orders.searchPlaceholder",
       "Search orders, tables, or waiters..."
       )}
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
       fullWidth
      />
     </div>
     <div className="flex gap-4">
      <Select
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
       options={[
        {
         value:"all",
         label: t("orders.allStatuses","All Statuses"),
        },
        {
         value: OrderStatus.PENDING,
         label: t("orders.pending","Pending"),
        },
        {
         value: OrderStatus.PREPARING,
         label: t("orders.preparing","Preparing"),
        },
        { value: OrderStatus.READY, label: t("orders.ready","Ready") },
        {
         value: OrderStatus.SERVED,
         label: t("orders.served","Served"),
        },
        {
         value: OrderStatus.COMPLETED,
         label: t("orders.completed","Completed"),
        },
        {
         value: OrderStatus.CANCELLED,
         label: t("orders.cancelled","Cancelled"),
        },
       ]}
      />
     </div>
    </div>
   </div>

   {/* Orders List */}
   {loading ? (
    <div className="flex justify-center items-center p-12">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
     <span className="ml-3 text-neutral-600">
      {t("common.loading","Loading...")}
     </span>
    </div>
   ) : (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
     {filteredOrders.length > 0 ? (
      <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
         <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.orderNumber","Order #")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.table","Table")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.items","Items")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.total","Total")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.status","Status")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("orders.time","Time")}
          </th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
           {t("common.actions","Actions")}
          </th>
         </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
         {filteredOrders.map((order) => (
          <tr
           key={order.id}
           className="hover:bg-neutral-50 transition-colors"
          >
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-semibold text-primary-900">
             {order.orderNumber}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-neutral-600">
             {t("orders.tableNumber","Table")}{" "}
             <span className="font-medium text-primary-700">
              {order.table?.number ||"N/A"}
             </span>
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-neutral-600">
             <span className="font-medium text-primary-900">
              {order.items?.length || 0}
             </span>{""}
             {order.items?.length === 1
              ? t("orders.item","item")
              : t("orders.items","items")}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-semibold text-primary-900">
             {formatCurrency(order.totalAmount)}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <span
             className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
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
            <div className="text-sm text-neutral-600">
             {formatTimeAgo(order.createdAt)}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <Button
             variant="ghost"
             size="sm"
             onClick={() => navigate(`/app/orders/${order.id}`)}
             leftIcon={<EyeIcon className="h-4 w-4" />}
            >
             {t("common.view","View")}
            </Button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     ) : (
      <div className="p-12 text-center">
       <div className="mb-4">
        <svg
         className="mx-auto h-12 w-12 text-neutral-400"
         fill="none"
         viewBox="0 0 24 24"
         stroke="currentColor"
        >
         <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
         />
        </svg>
       </div>
       <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {t("orders.noOrdersTitle","No orders found")}
       </h3>
       <p className="text-neutral-600 mb-6">
        {t(
        "orders.noOrdersDescription",
        "Start by creating your first order or adjust your filters."
        )}
       </p>
       <Button
        variant="primary"
        onClick={handleNewOrder}
        leftIcon={<PlusIcon className="h-4 w-4" />}
       >
        {t("orders.createFirstOrder","Create First Order")}
       </Button>
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
