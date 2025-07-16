import React, { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { tableAPI } from"../../services/api";
import { TableStatus } from"../../types/order";
import { useTranslation } from"react-i18next";
import socketService from"../../services/socket";
import { formatTimeAgo } from"../../utils/formatters";

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

const MobileTables: React.FC = () => {
 const [tables, setTables] = useState<Table[]>([]);
 const [loading, setLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const navigate = useNavigate();
 const { t } = useTranslation();

 useEffect(() => {
  fetchTables();

  // Set up socket listeners for real-time updates
  socketService.on("table:status", (updatedTable) => {
   setTables((prevTables) =>
    prevTables.map((table) =>
     table.id === updatedTable.id ? updatedTable : table
    )
   );
  });

  return () => {
   socketService.off("table:status");
  };
 }, []);

 const fetchTables = async () => {
  setLoading(true);
  try {
   const data = await tableAPI.getTables();
   setTables(data);
  } catch (error) {
   console.error("Error fetching tables:", error);
  } finally {
   setLoading(false);
  }
 };

 const handleTableClick = (table: Table) => {
  if (table.status === TableStatus.AVAILABLE) {
   navigate(`/mobile/tables/${table.id}/seat`);
  } else if (table.status === TableStatus.OCCUPIED) {
   navigate(`/mobile/tables/${table.id}/details`);
  } else if (table.status === TableStatus.RESERVED) {
   navigate(`/mobile/tables/${table.id}/seat`);
  }
 };

 const getStatusColor = (status: TableStatus) => {
  switch (status) {
   case TableStatus.AVAILABLE:
    return"bg-green-100 text-green-800 border-green-500";
   case TableStatus.OCCUPIED:
    return"bg-red-100 text-red-800 border-red-500";
   case TableStatus.RESERVED:
    return"bg-primary-100 text-primary-800 border-primary-500";
   default:
    return"bg-gray-100 text-gray-800 border-gray-500";
  }
 };

 const filteredTables = tables.filter(
  (table) => statusFilter ==="all" || table.status === statusFilter
 );

 return (
  <div className="p-4">
   <div className="mb-4 flex overflow-x-auto pb-2">
    <button
     className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
      statusFilter ==="all"
       ?"bg-primary-600 text-white"
       :"bg-white text-gray-700 border border-gray-300"
     }`}
     onClick={() => setStatusFilter("all")}
    >
     {t("tables.all")}
    </button>
    <button
     className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
      statusFilter === TableStatus.AVAILABLE
       ?"bg-green-500 text-white"
       :"bg-white text-gray-700 border border-gray-300"
     }`}
     onClick={() => setStatusFilter(TableStatus.AVAILABLE)}
    >
     {t("tables.available")}
    </button>
    <button
     className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
      statusFilter === TableStatus.OCCUPIED
       ?"bg-red-500 text-white"
       :"bg-white text-gray-700 border border-gray-300"
     }`}
     onClick={() => setStatusFilter(TableStatus.OCCUPIED)}
    >
     {t("tables.occupied")}
    </button>
    <button
     className={`px-4 py-2 rounded-full mr-2 text-sm font-medium ${
      statusFilter === TableStatus.RESERVED
       ?"bg-primary-600 text-white"
       :"bg-white text-gray-700 border border-gray-300"
     }`}
     onClick={() => setStatusFilter(TableStatus.RESERVED)}
    >
     {t("tables.reserved")}
    </button>
   </div>

   {loading ? (
    <div className="flex justify-center items-center p-12">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
   ) : (
    <div className="grid grid-cols-2 gap-4">
     {filteredTables.map((table) => (
      <div
       key={table.id}
       className={`bg-white rounded-xl shadow-card overflow-hidden border-t-4 ${getStatusColor(
        table.status
       )}`}
       onClick={() => handleTableClick(table)}
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
         <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
           table.status === TableStatus.AVAILABLE
            ?"bg-green-100 text-green-800"
            : table.status === TableStatus.OCCUPIED
            ?"bg-red-100 text-red-800"
            :"bg-primary-100 text-primary-800"
          }`}
         >
          {t(`tables.status.${table.status}`)}
         </span>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}
  </div>
 );
};

export default MobileTables;
