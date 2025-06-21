import { useState, useEffect } from"react";
import {
 ArrowPathIcon,
 DocumentTextIcon,
 DocumentArrowDownIcon,
 CalendarIcon,
 ChartBarIcon,
} from"@heroicons/react/24/outline";
import { dashboardAPI } from"../../services/api";
import { formatCurrency, formatDate } from"../../utils/formatters";

interface SalesData {
 date: string;
 amount: number;
}

interface PopularItem {
 id: string;
 name: string;
 count: number;
 percentage: number;
}

interface ReportData {
 salesData: SalesData[];
 popularItems: PopularItem[];
 totalSales: number;
 orderCount: number;
 period: string;
}

const Reports = () => {
 const [period, setPeriod] = useState<"day" |"week" | "month" | "year">(
 "month"
 );
 const [dateRange, setDateRange] = useState<{
  startDate: string;
  endDate: string;
 }>({
  startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
   .toISOString()
   .split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [reportData, setReportData] = useState<ReportData | null>(null);
 const [showExportMenu, setShowExportMenu] = useState(false);

 const fetchReportData = async () => {
  setLoading(true);
  setError(null);

  try {
   // Fetch sales data
   const salesData = await dashboardAPI.getSales(period);

   // Fetch popular items
   const popularItems = await dashboardAPI.getPopularItems(10);

   // Fetch stats
   const stats = await dashboardAPI.getStats(period);

   setReportData({
    salesData: salesData.salesData,
    popularItems,
    totalSales: stats.totalSales,
    orderCount: stats.orderCount,
    period,
   });
  } catch (err) {
   console.error("Error fetching report data:", err);
   setError("Failed to load report data. Please try again.");
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchReportData();
 }, [period]);

 const handlePeriodChange = (newPeriod:"day" | "week" | "month" | "year") => {
  setPeriod(newPeriod);
 };

 const handleDateRangeChange = (
  field:"startDate" | "endDate",
  value: string
 ) => {
  setDateRange((prev) => ({
   ...prev,
   [field]: value,
  }));
 };

 const [customReportData, setCustomReportData] = useState(null);
 const [customReportType, setCustomReportType] = useState<
 "sales" | "inventory" | "users"
 >("sales");
 const [customReportLoading, setCustomReportLoading] = useState(false);

 const handleCustomDateSearch = async () => {
  setCustomReportLoading(true);
  setError(null);

  try {
   const data = await dashboardAPI.getCustomReport(
    dateRange.startDate,
    dateRange.endDate,
    customReportType
   );
   setCustomReportData(data);
  } catch (err) {
   console.error("Error fetching custom report:", err);
   setError("Failed to load custom report data. Please try again.");
  } finally {
   setCustomReportLoading(false);
  }
 };

 const handleExportReport = () => {
  try {
   dashboardAPI.exportSalesReport(dateRange.startDate, dateRange.endDate);
  } catch (err) {
   console.error("Error exporting report:", err);
   setError("Failed to export report. Please try again.");
  }
 };

 const handleExportInventory = () => {
  try {
   dashboardAPI.exportInventoryReport();
  } catch (err) {
   console.error("Error exporting inventory:", err);
   setError("Failed to export inventory report. Please try again.");
  }
 };

 return (
  <div>
   <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
    <div className="flex space-x-2">
     <button
      onClick={fetchReportData}
      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
      title="Refresh report data"
     >
      <ArrowPathIcon className="h-5 w-5" />
     </button>
     <a
      href="/app/reports/advanced"
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
     >
      <ChartBarIcon className="h-5 w-5 mr-2" />
      Advanced Reports
     </a>
     <div className="relative inline-block text-left">
      <div>
       <button
        type="button"
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
        id="export-menu-button"
        aria-expanded="true"
        aria-haspopup="true"
        onClick={() => setShowExportMenu(!showExportMenu)}
       >
        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
        Export
       </button>
      </div>
      {showExportMenu && (
       <div
        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="export-menu-button"
        tabIndex={-1}
       >
        <div className="py-1" role="none">
         <button
          onClick={() => {
           handleExportReport();
           setShowExportMenu(false);
          }}
          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          role="menuitem"
          tabIndex={-1}
         >
          Export Sales Report (CSV)
         </button>
         <button
          onClick={() => {
           handleExportInventory();
           setShowExportMenu(false);
          }}
          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          role="menuitem"
          tabIndex={-1}
         >
          Export Inventory Report (CSV)
         </button>
        </div>
       </div>
      )}
     </div>
    </div>
   </div>

   {error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
     <p>{error}</p>
     <button
      onClick={fetchReportData}
      className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
     >
      Try Again
     </button>
    </div>
   )}

   <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
     <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
       Report Period
      </h3>
      <div className="flex items-center space-x-2">
       <button
        onClick={() => handlePeriodChange("day")}
        className={`px-3 py-1 rounded-md text-sm ${
         period ==="day"
          ?"bg-blue-500 text-white"
          :"bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
       >
        Day
       </button>
       <button
        onClick={() => handlePeriodChange("week")}
        className={`px-3 py-1 rounded-md text-sm ${
         period ==="week"
          ?"bg-blue-500 text-white"
          :"bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
       >
        Week
       </button>
       <button
        onClick={() => handlePeriodChange("month")}
        className={`px-3 py-1 rounded-md text-sm ${
         period ==="month"
          ?"bg-blue-500 text-white"
          :"bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
       >
        Month
       </button>
       <button
        onClick={() => handlePeriodChange("year")}
        className={`px-3 py-1 rounded-md text-sm ${
         period ==="year"
          ?"bg-blue-500 text-white"
          :"bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
       >
        Year
       </button>
      </div>
     </div>

     <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
       Custom Date Range
      </h3>
      <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-2">
       <div>
        <label
         htmlFor="startDate"
         className="block text-sm font-medium text-gray-700 mb-1"
        >
         Start Date
        </label>
        <input
         type="date"
         id="startDate"
         className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
         value={dateRange.startDate}
         onChange={(e) =>
          handleDateRangeChange("startDate", e.target.value)
         }
        />
       </div>
       <div>
        <label
         htmlFor="endDate"
         className="block text-sm font-medium text-gray-700 mb-1"
        >
         End Date
        </label>
        <input
         type="date"
         id="endDate"
         className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
         value={dateRange.endDate}
         onChange={(e) =>
          handleDateRangeChange("endDate", e.target.value)
         }
        />
       </div>
       <div>
        <label
         htmlFor="reportType"
         className="block text-sm font-medium text-gray-700 mb-1"
        >
         Report Type
        </label>
        <select
         id="reportType"
         className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
         value={customReportType}
         onChange={(e) =>
          setCustomReportType(
           e.target.value as"sales" | "inventory" | "users"
          )
         }
        >
         <option value="sales">Sales Report</option>
         <option value="inventory">Inventory Report</option>
         <option value="users">User Activity Report</option>
        </select>
       </div>
       <div>
        <button
         onClick={handleCustomDateSearch}
         className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
         Generate Report
        </button>
       </div>
      </div>
     </div>
    </div>
   </div>

   {customReportLoading ? (
    <div className="flex justify-center items-center p-12">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
     <span className="ml-3">Generating custom report...</span>
    </div>
   ) : customReportData ? (
    <div className="space-y-6 mb-8">
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
       Custom Report:{""}
       {customReportType ==="sales"
        ?"Sales"
        : customReportType ==="inventory"
        ?"Inventory"
        :"User Activity"}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
       Period: {new Date(dateRange.startDate).toLocaleDateString()} -{""}
       {new Date(dateRange.endDate).toLocaleDateString()}
      </p>

      {customReportType ==="sales" && (
       <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-semibold">
           {formatCurrency(customReportData.totalSales || 0)}
          </p>
         </div>
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-2">
         Sales by Date
        </h4>
        <div className="overflow-x-auto mb-6">
         <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
           <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Amount
            </th>
           </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
           {customReportData.salesByDate &&
            customReportData.salesByDate.map((item, index) => (
             <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {formatCurrency(item.amount)}
              </td>
             </tr>
            ))}
          </tbody>
         </table>
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-2">
         Sales by Category
        </h4>
        <div className="overflow-x-auto mb-6">
         <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
           <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Amount
            </th>
           </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
           {customReportData.salesByCategory &&
            customReportData.salesByCategory.map((item, index) => (
             <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {formatCurrency(item.amount)}
              </td>
             </tr>
            ))}
          </tbody>
         </table>
        </div>
       </>
      )}

      {customReportType ==="inventory" && (
       <>
        <div className="overflow-x-auto">
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
             Current Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Usage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Status
            </th>
           </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
           {customReportData.inventoryData &&
            customReportData.inventoryData.map((item) => (
             <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.currentStock}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {item.usage}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
               <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                 item.isLowStock
                  ?"bg-red-100 text-red-800"
                  :"bg-green-100 text-green-800"
                }`}
               >
                {item.isLowStock ?"Low Stock" : "OK"}
               </span>
              </td>
             </tr>
            ))}
          </tbody>
         </table>
        </div>
       </>
      )}

      {customReportType ==="users" && (
       <>
        <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
           <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             Sales
            </th>
           </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
           {customReportData.userActivity &&
            customReportData.userActivity.map((user) => (
             <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {user.fullName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {user.role}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {user.orderCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               {formatCurrency(user.totalSales)}
              </td>
             </tr>
            ))}
          </tbody>
         </table>
        </div>
       </>
      )}
     </div>
    </div>
   ) : null}

   {loading ? (
    <div className="flex justify-center items-center p-12">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
   ) : reportData ? (
    <div className="space-y-6">
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Total Sales</p>
        <p className="text-2xl font-semibold">
         {formatCurrency(reportData.totalSales)}
        </p>
       </div>
       <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Total Orders</p>
        <p className="text-2xl font-semibold">
         {reportData.orderCount}
        </p>
       </div>
      </div>
     </div>

     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
       Sales Data
      </h3>
      {reportData.salesData.length > 0 ? (
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
         <thead className="bg-gray-50">
          <tr>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date
           </th>
           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Sales Amount
           </th>
          </tr>
         </thead>
         <tbody className="bg-white divide-y divide-gray-200">
          {reportData.salesData.map((item, index) => (
           <tr key={index}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
             {item.date}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
             {formatCurrency(item.amount)}
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ) : (
       <div className="text-center text-gray-500 py-4">
        No sales data available for this period.
       </div>
      )}
     </div>

     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
       Popular Items
      </h3>
      {reportData.popularItems.length > 0 ? (
       <div className="space-y-4">
        {reportData.popularItems.map((item) => (
         <div key={item.id} className="mb-4 last:mb-0">
          <div className="flex justify-between mb-1">
           <span className="text-gray-700">{item.name}</span>
           <span className="text-gray-500 text-sm">
            {item.count} orders ({item.percentage}%)
           </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
           <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${item.percentage}%` }}
           ></div>
          </div>
         </div>
        ))}
       </div>
      ) : (
       <div className="text-center text-gray-500 py-4">
        No popular items data available.
       </div>
      )}
     </div>
    </div>
   ) : (
    <div className="bg-white rounded-lg shadow p-8 text-center">
     <p className="text-gray-500">Select a period to generate a report.</p>
    </div>
   )}
  </div>
 );
};

export default Reports;
