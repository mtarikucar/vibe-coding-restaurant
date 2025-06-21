import { useState, useEffect } from"react";
import { XMarkIcon } from"@heroicons/react/24/outline";
import { ReportType } from"../../services/reportApi";

interface ChartCustomizerProps {
 reportType: ReportType;
 initialParameters: Record<string, any>;
 onClose: () => void;
 onSave: (parameters: Record<string, any>) => void;
}

const ChartCustomizer: React.FC<ChartCustomizerProps> = ({
 reportType,
 initialParameters,
 onClose,
 onSave,
}) => {
 const [parameters, setParameters] = useState<Record<string, any>>({
  chartType:"bar",
  showLegend: true,
  showGrid: true,
  showLabels: true,
  colors: ["#3B82F6","#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
  title:"",
  xAxisLabel:"",
  yAxisLabel:"",
  ...initialParameters,
 });

 useEffect(() => {
  // Set default axis labels based on report type
  if (!parameters.xAxisLabel && !parameters.yAxisLabel) {
   switch (reportType) {
    case ReportType.SALES:
     setParameters((prev) => ({
      ...prev,
      xAxisLabel:"Date",
      yAxisLabel:"Sales Amount",
     }));
     break;
    case ReportType.INVENTORY:
     setParameters((prev) => ({
      ...prev,
      xAxisLabel:"Product",
      yAxisLabel:"Quantity",
     }));
     break;
    case ReportType.USERS:
     setParameters((prev) => ({
      ...prev,
      xAxisLabel:"User",
      yAxisLabel:"Activity",
     }));
     break;
    case ReportType.ORDERS:
     setParameters((prev) => ({
      ...prev,
      xAxisLabel:"Date",
      yAxisLabel:"Order Count",
     }));
     break;
    case ReportType.PAYMENTS:
     setParameters((prev) => ({
      ...prev,
      xAxisLabel:"Payment Method",
      yAxisLabel:"Amount",
     }));
     break;
    default:
     break;
   }
  }
 }, [reportType, parameters.xAxisLabel, parameters.yAxisLabel]);

 const handleInputChange = (
  e: React.ChangeEvent<
   HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >
 ) => {
  const { name, value } = e.target;
  setParameters((prev) => ({ ...prev, [name]: value }));
 };

 const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, checked } = e.target;
  setParameters((prev) => ({ ...prev, [name]: checked }));
 };

 const handleColorChange = (index: number, color: string) => {
  const newColors = [...parameters.colors];
  newColors[index] = color;
  setParameters((prev) => ({ ...prev, colors: newColors }));
 };

 const handleSave = () => {
  onSave(parameters);
  onClose();
 };

 // Get available chart types based on report type
 const getChartTypes = () => {
  const baseCharts = [
   { value:"bar", label: "Bar Chart" },
   { value:"line", label: "Line Chart" },
   { value:"pie", label: "Pie Chart" },
  ];

  switch (reportType) {
   case ReportType.SALES:
    return [
     ...baseCharts,
     { value:"area", label: "Area Chart" },
     { value:"combo", label: "Combo Chart" },
    ];
   case ReportType.INVENTORY:
    return [
     ...baseCharts,
     { value:"radar", label: "Radar Chart" },
     { value:"scatter", label: "Scatter Plot" },
    ];
   case ReportType.USERS:
    return [...baseCharts, { value:"heatmap", label: "Heat Map" }];
   default:
    return baseCharts;
  }
 };

 return (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
   <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
    <div className="flex justify-between items-center p-6 border-b">
     <h2 className="text-xl font-semibold text-gray-800">
      Customize Visualization
     </h2>
     <button
      onClick={onClose}
      className="text-gray-500 hover:text-gray-700"
     >
      <XMarkIcon className="h-6 w-6" />
     </button>
    </div>

    <div className="p-6">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Chart Type
       </label>
       <select
        name="chartType"
        value={parameters.chartType}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       >
        {getChartTypes().map((chart) => (
         <option key={chart.value} value={chart.value}>
          {chart.label}
         </option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Chart Title
       </label>
       <input
        type="text"
        name="title"
        value={parameters.title}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter chart title"
       />
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        X-Axis Label
       </label>
       <input
        type="text"
        name="xAxisLabel"
        value={parameters.xAxisLabel}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter x-axis label"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Y-Axis Label
       </label>
       <input
        type="text"
        name="yAxisLabel"
        value={parameters.yAxisLabel}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter y-axis label"
       />
      </div>
     </div>

     <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
       Chart Colors
      </label>
      <div className="flex flex-wrap gap-2">
       {parameters.colors.map((color: string, index: number) => (
        <div key={index} className="flex items-center">
         <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(index, e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer"
         />
        </div>
       ))}
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="flex items-center">
       <input
        type="checkbox"
        id="showLegend"
        name="showLegend"
        checked={parameters.showLegend}
        onChange={handleCheckboxChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <label
        htmlFor="showLegend"
        className="ml-2 block text-sm text-gray-700"
       >
        Show Legend
       </label>
      </div>

      <div className="flex items-center">
       <input
        type="checkbox"
        id="showGrid"
        name="showGrid"
        checked={parameters.showGrid}
        onChange={handleCheckboxChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <label
        htmlFor="showGrid"
        className="ml-2 block text-sm text-gray-700"
       >
        Show Grid
       </label>
      </div>

      <div className="flex items-center">
       <input
        type="checkbox"
        id="showLabels"
        name="showLabels"
        checked={parameters.showLabels}
        onChange={handleCheckboxChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
       />
       <label
        htmlFor="showLabels"
        className="ml-2 block text-sm text-gray-700"
       >
        Show Data Labels
       </label>
      </div>
     </div>

     {/* Chart Preview */}
     <div className="border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
      <div className="bg-white rounded-lg p-4 h-64 relative">
       {parameters.title && (
        <div className="text-center font-medium text-gray-800 mb-2">
         {parameters.title}
        </div>
       )}

       {parameters.chartType ==="bar" && (
        <div className="h-full flex items-end justify-around px-4 pt-4">
         {[0.4, 0.7, 0.5, 0.9, 0.6].map((height, i) => (
          <div key={i} className="flex flex-col items-center">
           <div
            className="w-10 rounded-t-sm transition-all duration-500"
            style={{
             height: `${height * 100}%`,
             backgroundColor:
              parameters.colors[i % parameters.colors.length],
            }}
           ></div>
           {parameters.showLabels && (
            <div className="text-xs mt-1 text-gray-600">
             {`${Math.round(height * 100)}%`}
            </div>
           )}
           <div className="text-xs mt-1 text-gray-500">
            Item {i + 1}
           </div>
          </div>
         ))}
        </div>
       )}

       {parameters.chartType ==="line" && (
        <div className="h-full w-full relative">
         <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
         >
          {parameters.showGrid && (
           <>
            <line
             x1="0"
             y1="25"
             x2="100"
             y2="25"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
            <line
             x1="0"
             y1="50"
             x2="100"
             y2="50"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
            <line
             x1="0"
             y1="75"
             x2="100"
             y2="75"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
           </>
          )}
          <polyline
           points="0,70 20,60 40,40 60,50 80,20 100,30"
           fill="none"
           stroke={parameters.colors[0]}
           strokeWidth="2"
          />
          {parameters.showLabels && (
           <>
            <circle
             cx="0"
             cy="70"
             r="2"
             fill={parameters.colors[0]}
            />
            <circle
             cx="20"
             cy="60"
             r="2"
             fill={parameters.colors[0]}
            />
            <circle
             cx="40"
             cy="40"
             r="2"
             fill={parameters.colors[0]}
            />
            <circle
             cx="60"
             cy="50"
             r="2"
             fill={parameters.colors[0]}
            />
            <circle
             cx="80"
             cy="20"
             r="2"
             fill={parameters.colors[0]}
            />
            <circle
             cx="100"
             cy="30"
             r="2"
             fill={parameters.colors[0]}
            />
           </>
          )}
         </svg>
        </div>
       )}

       {parameters.chartType ==="pie" && (
        <div className="h-full flex justify-center items-center">
         <svg width="150" height="150" viewBox="0 0 100 100">
          <circle
           cx="50"
           cy="50"
           r="40"
           fill={parameters.colors[0]}
          />
          <path
           d="M50,50 L50,10 A40,40 0 0,1 83.6,36.4 z"
           fill={parameters.colors[1]}
          />
          <path
           d="M50,50 L83.6,36.4 A40,40 0 0,1 83.6,63.6 z"
           fill={parameters.colors[2]}
          />
          <path
           d="M50,50 L83.6,63.6 A40,40 0 0,1 50,90 z"
           fill={parameters.colors[3]}
          />
          <path
           d="M50,50 L50,90 A40,40 0 0,1 16.4,63.6 z"
           fill={parameters.colors[4] || parameters.colors[0]}
          />
         </svg>
        </div>
       )}

       {parameters.chartType ==="area" && (
        <div className="h-full w-full relative">
         <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
         >
          {parameters.showGrid && (
           <>
            <line
             x1="0"
             y1="25"
             x2="100"
             y2="25"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
            <line
             x1="0"
             y1="50"
             x2="100"
             y2="50"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
            <line
             x1="0"
             y1="75"
             x2="100"
             y2="75"
             stroke="#e5e7eb"
             strokeWidth="0.5"
            />
           </>
          )}
          <path
           d="M0,70 L20,60 L40,40 L60,50 L80,20 L100,30 V100 H0 Z"
           fill={parameters.colors[0]}
           fillOpacity="0.3"
           stroke={parameters.colors[0]}
           strokeWidth="2"
          />
         </svg>
        </div>
       )}

       {/* X and Y axis labels */}
       {parameters.xAxisLabel && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500">
         {parameters.xAxisLabel}
        </div>
       )}

       {parameters.yAxisLabel && (
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -rotate-90 text-xs text-gray-500 origin-left">
         {parameters.yAxisLabel}
        </div>
       )}

       {/* Legend */}
       {parameters.showLegend && (
        <div className="absolute bottom-0 right-0 bg-white bg-opacity-70 p-1 rounded text-xs">
         <div className="flex items-center">
          <div
           className="w-3 h-3 mr-1"
           style={{ backgroundColor: parameters.colors[0] }}
          ></div>
          <span>Series 1</span>
         </div>
         {parameters.chartType ==="pie" && (
          <>
           <div className="flex items-center">
            <div
             className="w-3 h-3 mr-1"
             style={{ backgroundColor: parameters.colors[1] }}
            ></div>
            <span>Series 2</span>
           </div>
           <div className="flex items-center">
            <div
             className="w-3 h-3 mr-1"
             style={{ backgroundColor: parameters.colors[2] }}
            ></div>
            <span>Series 3</span>
           </div>
          </>
         )}
        </div>
       )}
      </div>
     </div>
    </div>

    <div className="flex justify-end p-6 border-t">
     <button
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
     >
      Cancel
     </button>
     <button
      onClick={handleSave}
      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
     >
      Apply Changes
     </button>
    </div>
   </div>
  </div>
 );
};

export default ChartCustomizer;
