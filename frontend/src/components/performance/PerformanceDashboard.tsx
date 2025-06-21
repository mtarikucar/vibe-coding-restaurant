import React, { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
import {
 ChartBarIcon,
 ClockIcon,
 ServerIcon,
 ArrowPathIcon,
 ExclamationTriangleIcon,
} from"@heroicons/react/24/outline";
import performanceMonitoringService, {
 MetricType,
} from"../../services/performanceMonitoring";

// Define the PerformanceMetric interface locally
interface PerformanceMetric {
 type: MetricType;
 name: string;
 duration: number;
 timestamp: number;
 metadata?: Record<string, any>;
}

// Helper function to format duration
const formatDuration = (duration: number): string => {
 if (duration < 1) {
  return `${(duration * 1000).toFixed(2)}μs`;
 } else if (duration < 1000) {
  return `${duration.toFixed(2)}ms`;
 } else {
  return `${(duration / 1000).toFixed(2)}s`;
 }
};

// Helper function to determine if a metric is slow
const isSlowMetric = (metric: PerformanceMetric): boolean => {
 const thresholds = {
  [MetricType.API_REQUEST]: 1000,
  [MetricType.PAGE_LOAD]: 3000,
  [MetricType.COMPONENT_RENDER]: 100,
  [MetricType.RESOURCE_LOAD]: 2000,
  [MetricType.USER_INTERACTION]: 100,
  [MetricType.CUSTOM]: 1000,
 };

 return metric.duration > thresholds[metric.type];
};

// Metric card component
const MetricCard = ({
 title,
 value,
 icon,
 color,
}: {
 title: string;
 value: string;
 icon: React.ReactNode;
 color: string;
}) => (
 <div className="bg-white rounded-lg shadow p-4">
  <div className="flex items-center">
   <div className={`rounded-full p-2 ${color}`}>{icon}</div>
   <div className="ml-3">
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <p className="text-xl font-semibold">{value}</p>
   </div>
  </div>
 </div>
);

// Performance dashboard component
const PerformanceDashboard: React.FC = () => {
 const { t } = useTranslation();
 const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
 const [filter, setFilter] = useState<MetricType |"all">("all");
 const [refreshKey, setRefreshKey] = useState(0);

 // Load metrics
 useEffect(() => {
  const allMetrics = performanceMonitoringService.getMetrics();
  setMetrics(allMetrics);

  // Add listener for new metrics
  const handleNewMetric = (metric: PerformanceMetric) => {
   setMetrics((prev) => [...prev, metric].slice(-100)); // Keep last 100 metrics
  };

  performanceMonitoringService.addMetricListener(handleNewMetric);

  return () => {
   performanceMonitoringService.removeMetricListener(handleNewMetric);
  };
 }, [refreshKey]);

 // Filter metrics
 const filteredMetrics =
  filter ==="all" ? metrics : metrics.filter((m) => m.type === filter);

 // Calculate stats
 const apiRequests = metrics.filter((m) => m.type === MetricType.API_REQUEST);
 const pageLoads = metrics.filter((m) => m.type === MetricType.PAGE_LOAD);
 const componentRenders = metrics.filter(
  (m) => m.type === MetricType.COMPONENT_RENDER
 );

 const avgApiTime = apiRequests.length
  ? apiRequests.reduce((sum, m) => sum + m.duration, 0) / apiRequests.length
  : 0;

 const avgPageLoadTime = pageLoads.length
  ? pageLoads.reduce((sum, m) => sum + m.duration, 0) / pageLoads.length
  : 0;

 const slowRequests = apiRequests.filter(isSlowMetric).length;

 // Handle refresh
 const handleRefresh = () => {
  setRefreshKey((prev) => prev + 1);
 };

 // Handle clear
 const handleClear = () => {
  performanceMonitoringService.clearMetrics();
  setRefreshKey((prev) => prev + 1);
 };

 return (
  <div className="p-6">
   <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-800">
     {t("performance.dashboard")}
    </h1>
    <div className="flex space-x-2">
     <button
      onClick={handleRefresh}
      className="px-3 py-2 bg-blue-500 text-white rounded-md flex items-center"
     >
      <ArrowPathIcon className="h-4 w-4 mr-1" />
      {t("common.refresh")}
     </button>
     <button
      onClick={handleClear}
      className="px-3 py-2 bg-gray-500 text-white rounded-md"
     >
      {t("common.delete")}
     </button>
    </div>
   </div>

   {/* Stats cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <MetricCard
     title={t("performance.metrics.apiRequests")}
     value={apiRequests.length.toString()}
     icon={<ServerIcon className="h-5 w-5 text-white" />}
     color="bg-blue-500"
    />
    <MetricCard
     title={t("performance.metrics.avgApiTime")}
     value={formatDuration(avgApiTime)}
     icon={<ClockIcon className="h-5 w-5 text-white" />}
     color="bg-green-500"
    />
    <MetricCard
     title={t("performance.metrics.avgPageLoad")}
     value={formatDuration(avgPageLoadTime)}
     icon={<ChartBarIcon className="h-5 w-5 text-white" />}
     color="bg-purple-500"
    />
    <MetricCard
     title={t("performance.metrics.slowRequests")}
     value={slowRequests.toString()}
     icon={<ExclamationTriangleIcon className="h-5 w-5 text-white" />}
     color="bg-red-500"
    />
   </div>

   {/* Filter controls */}
   <div className="mb-4">
    <div className="flex space-x-2">
     <button
      className={`px-3 py-1 rounded-md ${
       filter ==="all" ? "bg-blue-500 text-white" : "bg-gray-200"
      }`}
      onClick={() => setFilter("all")}
     >
      {t("performance.filters.all")}
     </button>
     <button
      className={`px-3 py-1 rounded-md ${
       filter === MetricType.API_REQUEST
        ?"bg-blue-500 text-white"
        :"bg-gray-200"
      }`}
      onClick={() => setFilter(MetricType.API_REQUEST)}
     >
      {t("performance.filters.api")}
     </button>
     <button
      className={`px-3 py-1 rounded-md ${
       filter === MetricType.PAGE_LOAD
        ?"bg-blue-500 text-white"
        :"bg-gray-200"
      }`}
      onClick={() => setFilter(MetricType.PAGE_LOAD)}
     >
      {t("performance.filters.pageLoad")}
     </button>
     <button
      className={`px-3 py-1 rounded-md ${
       filter === MetricType.COMPONENT_RENDER
        ?"bg-blue-500 text-white"
        :"bg-gray-200"
      }`}
      onClick={() => setFilter(MetricType.COMPONENT_RENDER)}
     >
      {t("performance.filters.components")}
     </button>
     <button
      className={`px-3 py-1 rounded-md ${
       filter === MetricType.USER_INTERACTION
        ?"bg-blue-500 text-white"
        :"bg-gray-200"
      }`}
      onClick={() => setFilter(MetricType.USER_INTERACTION)}
     >
      {t("performance.filters.interactions")}
     </button>
    </div>
   </div>

   {/* Metrics table */}
   <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
     <thead className="bg-gray-50">
      <tr>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("performance.table.type")}
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("performance.table.name")}
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("performance.table.duration")}
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("performance.table.timestamp")}
       </th>
       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("performance.table.details")}
       </th>
      </tr>
     </thead>
     <tbody className="bg-white divide-y divide-gray-200">
      {filteredMetrics.length === 0 ? (
       <tr>
        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
         {t("performance.table.noMetrics")}
        </td>
       </tr>
      ) : (
       filteredMetrics
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50)
        .map((metric, index) => (
         <tr
          key={index}
          className={isSlowMetric(metric) ?"bg-red-50" : ""}
         >
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
           {metric.type}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
           {metric.name}
          </td>
          <td
           className={`px-6 py-4 whitespace-nowrap text-sm ${
            isSlowMetric(metric)
             ?"text-red-600 font-bold"
             :"text-gray-500"
           }`}
          >
           {formatDuration(metric.duration)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
           {new Date(metric.timestamp).toLocaleTimeString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
           {metric.metadata ? (
            <details>
             <summary className="cursor-pointer">
              View Details
             </summary>
             <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(metric.metadata, null, 2)}
             </pre>
            </details>
           ) : (
           "No details"
           )}
          </td>
         </tr>
        ))
      )}
     </tbody>
    </table>
   </div>
  </div>
 );
};

export default PerformanceDashboard;
