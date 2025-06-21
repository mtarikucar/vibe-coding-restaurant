import { useState, useEffect } from"react";
import { PlusIcon, PencilIcon } from"@heroicons/react/24/outline";
import { useTableStore } from"../../store/tableStore";
import { type Table, TableStatus } from"../../types/table";
import { useTranslation } from"react-i18next";
import { formatTimeAgo } from"../../utils/formatters";
import AddTableModal from"../../components/tables/AddTableModal";
import EditTableModal from"../../components/tables/EditTableModal";
import TableDetailsModal from"../../components/tables/TableDetailsModal";
import { orderAPI } from"../../services/api";

const Tables = () => {
 const { t } = useTranslation();
 const {
  tables,
  fetchTables,
  isLoading,
  error,
  setAddModalOpen,
  setEditModalOpen,
  setDetailsModalOpen,
  setCurrentTable,
  setupSocketListeners,
 } = useTableStore();

 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [tableOrders, setTableOrders] = useState<Record<string, any>>({});

 useEffect(() => {
  fetchTables();
  setupSocketListeners();

  // Fetch active orders for occupied tables
  fetchActiveOrders();

  // Cleanup
  return () => {
   // Any cleanup if needed
  };
 }, []);

 const fetchActiveOrders = async () => {
  try {
   const orders = await orderAPI.getOrders();
   const activeOrders: Record<string, any> = {};

   orders.forEach((order: any) => {
    if (
     order.tableId &&
     (order.status ==="pending" ||
      order.status ==="preparing" ||
      order.status ==="ready" ||
      order.status ==="served")
    ) {
     activeOrders[order.tableId] = order;
    }
   });

   setTableOrders(activeOrders);
  } catch (error) {
   console.error("Error fetching active orders:", error);
  }
 };

 const filteredTables = tables.filter(
  (table) => statusFilter ==="all" || table.status === statusFilter
 );

 const getStatusColor = (status: TableStatus) => {
  switch (status) {
   case TableStatus.AVAILABLE:
    return"bg-green-100 text-green-800";
   case TableStatus.OCCUPIED:
    return"bg-red-100 text-red-800";
   case TableStatus.RESERVED:
    return"bg-blue-100 text-blue-800";
   case TableStatus.MAINTENANCE:
    return"bg-gray-100 text-gray-800";
   default:
    return"bg-gray-100 text-gray-800";
  }
 };

 const handleAddTable = () => {
  setAddModalOpen(true);
 };

 const handleEditTable = (table: Table) => {
  setCurrentTable(table);
  setEditModalOpen(true);
 };

 const handleTableDetails = (table: Table) => {
  setCurrentTable(table);
  setDetailsModalOpen(true);
 };

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">
     {t("tables.management")}
    </h2>
    <button
     className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
     onClick={handleAddTable}
    >
     <PlusIcon className="h-5 w-5 mr-2" />
     {t("tables.addTable")}
    </button>
   </div>

   {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
     {error}
    </div>
   )}

   <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex items-center">
     <div>
      <label
       htmlFor="status"
       className="block text-sm font-medium text-gray-700 mb-1"
      >
       {t("tables.status.label")}
      </label>
      <select
       id="status"
       className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
      >
       <option value="all">{t("tables.allStatuses")}</option>
       <option value={TableStatus.AVAILABLE}>
        {t("tables.status.available")}
       </option>
       <option value={TableStatus.OCCUPIED}>
        {t("tables.status.occupied")}
       </option>
       <option value={TableStatus.RESERVED}>
        {t("tables.status.reserved")}
       </option>
       <option value={TableStatus.MAINTENANCE}>
        {t("tables.status.maintenance")}
       </option>
      </select>
     </div>
     <div className="ml-auto flex space-x-4">
      <div className="flex items-center">
       <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
       <span className="text-sm text-gray-600">
        {t("tables.status.available")}
       </span>
      </div>
      <div className="flex items-center">
       <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
       <span className="text-sm text-gray-600">
        {t("tables.status.occupied")}
       </span>
      </div>
      <div className="flex items-center">
       <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
       <span className="text-sm text-gray-600">
        {t("tables.status.reserved")}
       </span>
      </div>
      <div className="flex items-center">
       <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
       <span className="text-sm text-gray-600">
        {t("tables.status.maintenance")}
       </span>
      </div>
     </div>
    </div>
   </div>

   {isLoading ? (
    <div className="flex justify-center items-center p-12">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
   ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
     {filteredTables.map((table) => (
      <div
       key={table.id}
       className={`bg-white rounded-lg shadow overflow-hidden border-t-4 ${
        table.status === TableStatus.AVAILABLE
         ?"border-green-500"
         : table.status === TableStatus.OCCUPIED
         ?"border-red-500"
         : table.status === TableStatus.RESERVED
         ?"border-blue-500"
         :"border-gray-500"
       }`}
      >
       <div className="p-4">
        <div className="flex justify-between items-start">
         <div>
          <h3 className="text-lg font-semibold text-gray-900">
           {t("tables.tableNumber", { number: table.number })}
          </h3>
          <p className="text-sm text-gray-500">
           {t("tables.capacity", { count: table.capacity })}
          </p>
         </div>
         <button
          className="text-gray-400 hover:text-gray-500"
          onClick={() => handleEditTable(table)}
         >
          <PencilIcon className="h-5 w-5" />
         </button>
        </div>
        <div className="mt-4">
         <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
           table.status
          )}`}
         >
          {t(`tables.status.${table.status}`)}
         </span>
         {table.status === TableStatus.OCCUPIED &&
          tableOrders[table.id] && (
           <div className="mt-2 text-sm text-gray-500">
            <p>
             {t("tables.occupiedFor")}:{""}
             {formatTimeAgo(
              new Date(tableOrders[table.id].createdAt)
             )}
            </p>
            <p>
             {t("tables.order")}:{""}
             {tableOrders[table.id].orderNumber}
            </p>
           </div>
          )}
        </div>
        <div className="mt-4 flex space-x-2">
         <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm w-full"
          onClick={() => handleTableDetails(table)}
         >
          {t("tables.details")}
         </button>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   {/* Modals */}
   <AddTableModal />
   <EditTableModal />
   <TableDetailsModal />
  </div>
 );
};

export default Tables;
