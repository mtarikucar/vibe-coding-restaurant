import { useState, useEffect } from"react";
import { Link } from"react-router-dom";
import {
 PlusIcon,
 PencilIcon,
 ArrowUpIcon,
 ArrowDownIcon,
 ArrowPathIcon,
 ExclamationCircleIcon,
 XMarkIcon,
 TruckIcon,
 BuildingStorefrontIcon,
 ChartBarIcon,
} from"@heroicons/react/24/outline";
import { stockAPI } from"../../services/api";
import { formatDate } from"../../utils/formatters";
import socketService from"../../services/socket";

interface MenuItem {
 id: string;
 name: string;
 category: {
  id: string;
  name: string;
 };
}

interface StockItem {
 id: string;
 menuItem: MenuItem;
 quantity: number;
 minQuantity: number;
 isLowStock: boolean;
 updatedAt: string;
}

interface StockAdjustment {
 quantity: number;
 actionType:"INCREASE" | "DECREASE";
 notes: string;
}

const Stock = () => {
 const [stockItems, setStockItems] = useState<StockItem[]>([]);
 const [categoryFilter, setCategoryFilter] = useState<string>("all");
 const [stockFilter, setStockFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Modal states
 const [showAdjustModal, setShowAdjustModal] = useState(false);
 const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
 const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
 const [adjustmentType, setAdjustmentType] = useState<"INCREASE" |"DECREASE">(
 "INCREASE"
 );
 const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");

 const fetchStockItems = async () => {
  setLoading(true);
  setError(null);

  try {
   const data = await stockAPI.getStocks();
   setStockItems(data);
  } catch (err) {
   console.error("Error fetching stock items:", err);
   setError("Failed to load stock items. Please try again.");
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchStockItems();

  // Connect to socket for real-time updates
  const socket = socketService.connect();

  // Listen for stock updates
  socketService.on("stock:updated", (updatedStock) => {
   setStockItems((prevItems) =>
    prevItems.map((item) =>
     item.id === updatedStock.id ? updatedStock : item
    )
   );
  });

  // Listen for low stock alerts
  socketService.on("stock:low", (lowStock) => {
   // You could show a notification here
   console.log("Low stock alert:", lowStock);
  });

  return () => {
   // Clean up socket listeners
   socketService.off("stock:updated", () => {});
   socketService.off("stock:low", () => {});
  };
 }, []);

 const handleAdjustStock = async () => {
  if (!selectedStock) return;

  try {
   const adjustmentData: StockAdjustment = {
    quantity: adjustmentQuantity,
    actionType: adjustmentType,
    notes: adjustmentNotes || `Manual ${adjustmentType.toLowerCase()}`,
   };

   await stockAPI.adjustStock(selectedStock.id, adjustmentData);

   // Close modal and reset form
   setShowAdjustModal(false);
   setSelectedStock(null);
   setAdjustmentQuantity(0);
   setAdjustmentType("INCREASE");
   setAdjustmentNotes("");

   // Refresh stock items
   fetchStockItems();
  } catch (err) {
   console.error("Error adjusting stock:", err);
   setError("Failed to adjust stock. Please try again.");
  }
 };

 const openAdjustModal = (stock: StockItem, type:"INCREASE" | "DECREASE") => {
  setSelectedStock(stock);
  setAdjustmentType(type);
  setAdjustmentQuantity(0);
  setAdjustmentNotes("");
  setShowAdjustModal(true);
 };

 // Get unique categories from stock items
 const categories = [
  ...new Set(
   stockItems.map((item) => item.menuItem?.category?.name ||"Uncategorized")
  ),
 ];

 const filteredItems = stockItems.filter((item) => {
  const matchesCategory =
   categoryFilter ==="all" ||
   item.menuItem?.category?.name === categoryFilter;
  const matchesStock =
   stockFilter ==="all" ||
   (stockFilter ==="low" && item.isLowStock) ||
   (stockFilter ==="normal" && !item.isLowStock);
  const matchesSearch = item.menuItem?.name
   .toLowerCase()
   .includes(searchQuery.toLowerCase());
  return matchesCategory && matchesStock && matchesSearch;
 });

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Stock Management</h2>
    <div className="flex space-x-2">
     <button
      onClick={fetchStockItems}
      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
      title="Refresh stock data"
     >
      <ArrowPathIcon className="h-5 w-5" />
     </button>
     <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
      <PlusIcon className="h-5 w-5 mr-2" />
      Add Item
     </button>
    </div>
   </div>

   {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
     <p>{error}</p>
     <button
      onClick={fetchStockItems}
      className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
     >
      Try Again
     </button>
    </div>
   )}

   {/* Advanced Stock Management Navigation */}
   <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">
     Advanced Stock Management
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
     <Link
      to="/app/stock/suppliers"
      className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
     >
      <BuildingStorefrontIcon className="h-6 w-6 text-blue-600 mr-2" />
      <div>
       <h4 className="font-medium text-blue-800">Suppliers</h4>
       <p className="text-sm text-blue-600">Manage your suppliers</p>
      </div>
     </Link>

     <Link
      to="/app/stock/purchase-orders"
      className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
     >
      <TruckIcon className="h-6 w-6 text-green-600 mr-2" />
      <div>
       <h4 className="font-medium text-green-800">Purchase Orders</h4>
       <p className="text-sm text-green-600">Create and track orders</p>
      </div>
     </Link>

     <button
      onClick={() =>
       stockAPI
        .getPurchaseSuggestions()
        .then((data) => console.log(data))
      }
      className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
     >
      <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
      <div>
       <h4 className="font-medium text-purple-800">
        Inventory Forecast
       </h4>
       <p className="text-sm text-purple-600">View stock predictions</p>
      </div>
     </button>
    </div>
   </div>

   {/* Filters */}
   <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
     <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
      <div>
       <label
        htmlFor="category"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Category
       </label>
       <select
        id="category"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
       >
        <option value="all">All Categories</option>
        {categories.map((category) => (
         <option key={category} value={category}>
          {category}
         </option>
        ))}
       </select>
      </div>
      <div>
       <label
        htmlFor="stock"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Stock Level
       </label>
       <select
        id="stock"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={stockFilter}
        onChange={(e) => setStockFilter(e.target.value)}
       >
        <option value="all">All Levels</option>
        <option value="low">Low Stock</option>
        <option value="normal">Normal Stock</option>
       </select>
      </div>
      <div>
       <label
        htmlFor="search"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Search
       </label>
       <input
        type="text"
        id="search"
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
       />
      </div>
     </div>
    </div>
   </div>

   <div className="bg-white rounded-lg shadow overflow-hidden">
    {loading ? (
     <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
     </div>
    ) : filteredItems.length > 0 ? (
     <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
       <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Item
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Category
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Quantity
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Min. Quantity
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Last Updated
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
         Actions
        </th>
       </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
       {filteredItems.map((item) => (
        <tr key={item.id}>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
           {item.menuItem?.name}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
           {item.menuItem?.category?.name}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{item.quantity}</div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
           {item.minQuantity}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <span
           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.isLowStock
             ?"bg-red-100 text-red-800"
             :"bg-green-100 text-green-800"
           }`}
          >
           {item.isLowStock ?"Low Stock" : "In Stock"}
          </span>
         </td>
         <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
           {formatDate(item.updatedAt)}
          </div>
         </td>
         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-2">
           <button
            className="text-blue-600 hover:text-blue-900"
            title="Edit item"
           >
            <PencilIcon className="h-5 w-5" />
           </button>
           <button
            className="text-green-600 hover:text-green-900"
            title="Increase stock"
            onClick={() => openAdjustModal(item,"INCREASE")}
           >
            <ArrowUpIcon className="h-5 w-5" />
           </button>
           <button
            className="text-red-600 hover:text-red-900"
            title="Decrease stock"
            onClick={() => openAdjustModal(item,"DECREASE")}
           >
            <ArrowDownIcon className="h-5 w-5" />
           </button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    ) : (
     <div className="p-8 text-center text-gray-500">
      No stock items found matching your filters.
     </div>
    )}
   </div>

   {/* Stock Adjustment Modal */}
   {showAdjustModal && selectedStock && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
     <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
       <h3 className="text-lg font-medium text-gray-900">
        {adjustmentType ==="INCREASE" ? "Increase" : "Decrease"} Stock
       </h3>
       <button
        onClick={() => setShowAdjustModal(false)}
        className="text-gray-400 hover:text-gray-500"
       >
        <XMarkIcon className="h-6 w-6" />
       </button>
      </div>

      <div className="mb-4">
       <p className="text-sm text-gray-500 mb-1">Item</p>
       <p className="font-medium">{selectedStock.menuItem?.name}</p>
      </div>

      <div className="mb-4">
       <p className="text-sm text-gray-500 mb-1">Current Quantity</p>
       <p className="font-medium">{selectedStock.quantity}</p>
      </div>

      <div className="mb-4">
       <label
        htmlFor="quantity"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        {adjustmentType ==="INCREASE" ? "Add" : "Remove"} Quantity
       </label>
       <input
        type="number"
        id="quantity"
        min="1"
        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={adjustmentQuantity}
        onChange={(e) =>
         setAdjustmentQuantity(
          Math.max(1, parseInt(e.target.value) || 0)
         )
        }
       />
      </div>

      <div className="mb-6">
       <label
        htmlFor="notes"
        className="block text-sm font-medium text-gray-700 mb-1"
       >
        Notes (Optional)
       </label>
       <textarea
        id="notes"
        rows={3}
        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Add notes about this adjustment..."
        value={adjustmentNotes}
        onChange={(e) => setAdjustmentNotes(e.target.value)}
       ></textarea>
      </div>

      <div className="flex justify-end space-x-3">
       <button
        onClick={() => setShowAdjustModal(false)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
       >
        Cancel
       </button>
       <button
        onClick={handleAdjustStock}
        className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
         adjustmentType ==="INCREASE"
          ?"bg-green-600 hover:bg-green-700"
          :"bg-red-600 hover:bg-red-700"
        }`}
       >
        {adjustmentType ==="INCREASE" ? "Add Stock" : "Remove Stock"}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default Stock;
