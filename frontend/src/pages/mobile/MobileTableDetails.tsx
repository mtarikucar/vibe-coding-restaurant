import React, { useState, useEffect } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { tableAPI, orderAPI } from"../../services/api";
import { TableStatus,type Order } from"../../types/order";
import { useTranslation } from"react-i18next";
import { formatTimeAgo, formatCurrency } from"../../utils/formatters";
import useAuthStore from"../../store/authStore";
import { PlusIcon, MinusIcon } from"@heroicons/react/24/outline";

// Define Table interface locally to avoid import issues
interface Table {
 id: string;
 number: number;
 capacity: number;
 status: TableStatus;
 location?: string;
 createdAt: string;
 updatedAt: string;
}

const MobileTableDetails: React.FC = () => {
 const { tableId } = useParams<{ tableId: string }>();
 const [table, setTable] = useState<Table | null>(null);
 const [activeOrder, setActiveOrder] = useState<Order | null>(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();
 const { t } = useTranslation();
 const { user } = useAuthStore();

 useEffect(() => {
  if (tableId) {
   fetchTableDetails();
  }
 }, [tableId]);

 const fetchTableDetails = async () => {
  setLoading(true);
  try {
   const tableData = await tableAPI.getTable(tableId!);
   setTable(tableData);

   // Check if there's an active order for this table
   if (tableData.status === TableStatus.OCCUPIED) {
    try {
     // In a real app, you would have an API endpoint to get active orders by table
     const orders = await orderAPI.getOrders();
     const tableOrder = orders.find(
      (order: Order) =>
       order.tableId === tableId &&
       (order.status ==="pending" ||
        order.status ==="preparing" ||
        order.status ==="ready")
     );
     if (tableOrder) {
      setActiveOrder(tableOrder);
     }
    } catch (error) {
     console.error("Error fetching active order:", error);
    }
   }
  } catch (error) {
   console.error("Error fetching table details:", error);
  } finally {
   setLoading(false);
  }
 };

 const handleCreateOrder = () => {
  navigate(`/mobile/tables/${tableId}/new-order`);
 };

 const handleViewOrder = () => {
  if (activeOrder) {
   navigate(`/mobile/orders/${activeOrder.id}`);
  }
 };

 const handleSeatGuests = async () => {
  try {
   await tableAPI.updateTableStatus(tableId!, TableStatus.OCCUPIED);
   // Refresh table data
   fetchTableDetails();
  } catch (error) {
   console.error("Error updating table status:", error);
  }
 };

 const handleClearTable = async () => {
  try {
   await tableAPI.updateTableStatus(tableId!, TableStatus.AVAILABLE);
   // Refresh table data
   fetchTableDetails();
  } catch (error) {
   console.error("Error updating table status:", error);
  }
 };

 if (loading) {
  return (
   <div className="flex justify-center items-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
   </div>
  );
 }

 if (!table) {
  return (
   <div className="p-4">
    <div className="text-center py-12">
     <p className="text-gray-500">{t("tables.notFound")}</p>
    </div>
   </div>
  );
 }

 return (
  <div className="p-4">
   <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div className="p-6">
     <div className="flex justify-between items-start">
      <div>
       <h2 className="text-2xl font-semibold text-gray-900">
        {t("tables.tableNumber", { number: table.number })}
       </h2>
       <p className="text-sm text-gray-500 mt-1">
        {t("tables.capacity", { count: table.capacity })}
       </p>
      </div>
      <span
       className={`px-3 py-1 text-sm font-semibold rounded-full ${
        table.status === TableStatus.AVAILABLE
         ?"bg-green-100 text-green-800"
         : table.status === TableStatus.OCCUPIED
         ?"bg-red-100 text-red-800"
         :"bg-blue-100 text-blue-800"
       }`}
      >
       {t(`tables.status.${table.status}`)}
      </span>
     </div>

     <div className="mt-6 space-y-4">
      {table.status === TableStatus.AVAILABLE && (
       <button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
        onClick={handleSeatGuests}
       >
        {t("tables.seatGuests")}
       </button>
      )}

      {table.status === TableStatus.OCCUPIED && (
       <>
        {activeOrder ? (
         <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
           <div>
            <h3 className="font-medium text-gray-900">
             {activeOrder.orderNumber}
            </h3>
            <p className="text-sm text-gray-500">
             {activeOrder.items.length} {t("orders.items")} ·{""}
             {formatCurrency(activeOrder.totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
             {formatTimeAgo(new Date(activeOrder.createdAt))}
            </p>
           </div>
           <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
            onClick={handleViewOrder}
           >
            {t("orders.viewOrder")}
           </button>
          </div>
         </div>
        ) : (
         <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
          onClick={handleCreateOrder}
         >
          {t("orders.createOrder")}
         </button>
        )}

        <button
         className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium"
         onClick={handleClearTable}
        >
         {t("tables.clearTable")}
        </button>
       </>
      )}

      {table.status === TableStatus.RESERVED && (
       <button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
        onClick={handleSeatGuests}
       >
        {t("tables.seatGuests")}
       </button>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};

export default MobileTableDetails;
