import React, { useState, useEffect } from"react";
import { XMarkIcon } from"@heroicons/react/24/outline";
import { useTableStore } from"../../store/tableStore";
import { TableStatus } from"../../types/table";
import { useTranslation } from"react-i18next";
import { orderAPI } from"../../services/api";
import { formatTimeAgo, formatCurrency } from"../../utils/formatters";
import { useNavigate } from"react-router-dom";

const TableDetailsModal: React.FC = () => {
 const { t } = useTranslation();
 const navigate = useNavigate();
 const {
  isDetailsModalOpen,
  setDetailsModalOpen,
  currentTable,
  updateTableStatus,
 } = useTableStore();

 const [activeOrder, setActiveOrder] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  if (currentTable && currentTable.status === TableStatus.OCCUPIED) {
   fetchActiveOrder();
  } else {
   setActiveOrder(null);
  }
 }, [currentTable]);

 const fetchActiveOrder = async () => {
  if (!currentTable) return;

  setLoading(true);
  try {
   const orders = await orderAPI.getOrders();
   const tableOrder = orders.find(
    (order: any) =>
     order.tableId === currentTable.id &&
     (order.status ==="pending" ||
      order.status ==="preparing" ||
      order.status ==="ready" ||
      order.status ==="served")
   );

   if (tableOrder) {
    setActiveOrder(tableOrder);
   } else {
    setActiveOrder(null);
   }
  } catch (err) {
   console.error("Error fetching active order:", err);
   setError(t("tables.errors.fetchOrderFailed"));
  } finally {
   setLoading(false);
  }
 };

 const handleSeatGuests = async () => {
  if (!currentTable) return;

  try {
   await updateTableStatus(currentTable.id, TableStatus.OCCUPIED);
   setError(null);
  } catch (err) {
   console.error("Error updating table status:", err);
   setError(t("tables.errors.updateStatusFailed"));
  }
 };

 const handleClearTable = async () => {
  if (!currentTable) return;

  try {
   await updateTableStatus(currentTable.id, TableStatus.AVAILABLE);
   setActiveOrder(null);
   setError(null);
  } catch (err) {
   console.error("Error updating table status:", err);
   setError(t("tables.errors.updateStatusFailed"));
  }
 };

 const handleCreateOrder = () => {
  if (!currentTable) return;
  setDetailsModalOpen(false);
  navigate(`/app/orders/new?tableId=${currentTable.id}`);
 };

 const handleViewOrder = () => {
  if (!activeOrder) return;
  setDetailsModalOpen(false);
  navigate(`/orders/${activeOrder.id}`);
 };

 if (!isDetailsModalOpen || !currentTable) return null;

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
   <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
    <div className="flex justify-between items-center p-4 border-b">
     <h2 className="text-xl font-semibold text-gray-800">
      {t("tables.tableDetails", { number: currentTable.number })}
     </h2>
     <button
      onClick={() => setDetailsModalOpen(false)}
      className="text-gray-500 hover:text-gray-700"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>

    <div className="p-4">
     {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
       {error}
      </div>
     )}

     <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
       <span className="text-sm font-medium text-gray-500">
        {t("tables.tableNumber")}
       </span>
       <span className="text-sm font-semibold">
        {currentTable.number}
       </span>
      </div>
      <div className="flex justify-between items-center mb-2">
       <span className="text-sm font-medium text-gray-500">
        {t("tables.capacity")}
       </span>
       <span className="text-sm font-semibold">
        {currentTable.capacity}
       </span>
      </div>
      <div className="flex justify-between items-center mb-2">
       <span className="text-sm font-medium text-gray-500">
        {t("tables.status.label")}
       </span>
       <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
         currentTable.status === TableStatus.AVAILABLE
          ?"bg-green-100 text-green-800"
          : currentTable.status === TableStatus.OCCUPIED
          ?"bg-red-100 text-red-800"
          : currentTable.status === TableStatus.RESERVED
          ?"bg-blue-100 text-blue-800"
          :"bg-gray-100 text-gray-800"
        }`}
       >
        {t(`tables.status.${currentTable.status}`)}
       </span>
      </div>
      {currentTable.location && (
       <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">
         {t("tables.location")}
        </span>
        <span className="text-sm font-semibold">
         {currentTable.location}
        </span>
       </div>
      )}
     </div>

     {loading ? (
      <div className="flex justify-center items-center py-4">
       <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
     ) : (
      <div className="mt-6 space-y-4">
       {currentTable.status === TableStatus.AVAILABLE && (
        <button
         className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
         onClick={handleSeatGuests}
        >
         {t("tables.seatGuests")}
        </button>
       )}

       {currentTable.status === TableStatus.OCCUPIED && (
        <>
         {activeOrder ? (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
           <div className="flex justify-between items-center">
            <div>
             <h3 className="font-medium text-gray-900">
              {activeOrder.orderNumber}
             </h3>
             <p className="text-sm text-gray-500">
              {activeOrder.items?.length || 0} {t("orders.items")}{""}
              · {formatCurrency(activeOrder.totalAmount)}
             </p>
             <p className="text-xs text-gray-500 mt-1">
              {formatTimeAgo(new Date(activeOrder.createdAt))}
             </p>
            </div>
            <button
             className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium"
             onClick={handleViewOrder}
            >
             {t("orders.viewOrder")}
            </button>
           </div>
          </div>
         ) : (
          <button
           className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
           onClick={handleCreateOrder}
          >
           {t("orders.createOrder")}
          </button>
         )}

         <button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium"
          onClick={handleClearTable}
         >
          {t("tables.clearTable")}
         </button>
        </>
       )}

       {currentTable.status === TableStatus.RESERVED && (
        <button
         className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
         onClick={handleSeatGuests}
        >
         {t("tables.seatGuests")}
        </button>
       )}
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

export default TableDetailsModal;
