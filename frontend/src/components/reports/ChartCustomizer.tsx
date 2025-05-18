import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ReportType } from "../../services/reportApi";

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
    chartType: "bar",
    showLegend: true,
    showGrid: true,
    showLabels: true,
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
    title: "",
    xAxisLabel: "",
    yAxisLabel: "",
    ...initialParameters,
  });

  useEffect(() => {
    // Set default axis labels based on report type
    if (!parameters.xAxisLabel && !parameters.yAxisLabel) {
      switch (reportType) {
        case ReportType.SALES:
          setParameters((prev) => ({
            ...prev,
            xAxisLabel: "Date",
            yAxisLabel: "Sales Amount",
          }));
          break;
        case ReportType.INVENTORY:
          setParameters((prev) => ({
            ...prev,
            xAxisLabel: "Product",
            yAxisLabel: "Quantity",
          }));
          break;
        case ReportType.USERS:
          setParameters((prev) => ({
            ...prev,
            xAxisLabel: "User",
            yAxisLabel: "Activity",
          }));
          break;
        case ReportType.ORDERS:
          setParameters((prev) => ({
            ...prev,
            xAxisLabel: "Date",
            yAxisLabel: "Order Count",
          }));
          break;
        case ReportType.PAYMENTS:
          setParameters((prev) => ({
            ...prev,
            xAxisLabel: "Payment Method",
            yAxisLabel: "Amount",
          }));
          break;
        default:
          break;
      }
    }
  }, [reportType, parameters.xAxisLabel, parameters.yAxisLabel]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      { value: "bar", label: "Bar Chart" },
      { value: "line", label: "Line Chart" },
      { value: "pie", label: "Pie Chart" },
    ];

    switch (reportType) {
      case ReportType.SALES:
        return [
          ...baseCharts,
          { value: "area", label: "Area Chart" },
          { value: "combo", label: "Combo Chart" },
        ];
      case ReportType.INVENTORY:
        return [
          ...baseCharts,
          { value: "radar", label: "Radar Chart" },
          { value: "scatter", label: "Scatter Plot" },
        ];
      case ReportType.USERS:
        return [
          ...baseCharts,
          { value: "heatmap", label: "Heat Map" },
        ];
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

          {/* Chart Preview Placeholder */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="text-center text-gray-500 py-12">
              Chart preview will be available in the final implementation.
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
