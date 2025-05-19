import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import reportAPI, {
  ReportType,
  ReportFormat,
  type CreateReportDto as ReportCreateDto,
  type ReportGenerateDto,
} from "../../services/reportApi";
import type { Report, ReportTemplate } from "../../types/report.types";
import AdvancedFilters from "./AdvancedFilters";
import ChartCustomizer from "./ChartCustomizer";

interface ReportBuilderProps {
  report: Report | null;
  templates: ReportTemplate[];
  onClose: () => void;
  onSave: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  report,
  templates,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ReportCreateDto>({
    name: "",
    description: "",
    type: ReportType.SALES,
    filters: {},
    parameters: {},
    format: ReportFormat.PDF,
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showChartCustomizer, setShowChartCustomizer] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [generateAfterSave, setGenerateAfterSave] = useState(false);

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || "",
        type: report.type,
        filters: report.filters || {},
        parameters: report.parameters || {},
        format: report.format,
        isPublic: report.isPublic,
        templateId: report.templateId,
        scheduleId: report.scheduleId,
      });

      if (report.startDate) {
        setDateRange((prev) => ({
          ...prev,
          startDate: new Date(report.startDate!).toISOString().split("T")[0],
        }));
      }

      if (report.endDate) {
        setDateRange((prev) => ({
          ...prev,
          endDate: new Date(report.endDate!).toISOString().split("T")[0],
        }));
      }
    }
  }, [report]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (templateId) {
      const selectedTemplate = templates.find((t) => t.id === templateId);
      if (selectedTemplate) {
        setFormData((prev) => ({
          ...prev,
          templateId,
          type: selectedTemplate.type,
          parameters: selectedTemplate.defaultParameters || {},
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        templateId: undefined,
      }));
    }
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, filters }));
  };

  const handleParametersChange = (parameters: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, parameters }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const reportData = {
        ...formData,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      let savedReport: Report;

      if (report) {
        // Update existing report
        savedReport = await reportAPI.updateReport(report.id, reportData);
      } else {
        // Create new report
        savedReport = await reportAPI.createReport(reportData);
      }

      if (generateAfterSave) {
        // Generate report
        const generateData: ReportGenerateDto = {
          reportId: savedReport.id,
          type: savedReport.type,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          format: savedReport.format,
        };

        await reportAPI.generateReport(generateData);
      }

      onSave();
    } catch (err) {
      console.error("Error saving report:", err);
      setError("Failed to save report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {report ? "Edit Report" : "Create New Report"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ReportType.SALES}>Sales Report</option>
                <option value={ReportType.INVENTORY}>Inventory Report</option>
                <option value={ReportType.USERS}>User Activity Report</option>
                <option value={ReportType.ORDERS}>Order Report</option>
                <option value={ReportType.PAYMENTS}>Payment Report</option>
                <option value={ReportType.CUSTOM}>Custom Report</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter report description"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                name="templateId"
                value={formData.templateId || ""}
                onChange={handleTemplateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ReportFormat.PDF}>PDF</option>
                <option value={ReportFormat.CSV}>CSV</option>
                <option value={ReportFormat.EXCEL}>Excel</option>
                <option value={ReportFormat.JSON}>JSON</option>
                <option value={ReportFormat.HTML}>HTML</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-700"
              >
                Make this report public (visible to all users)
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateAfterSave"
                name="generateAfterSave"
                checked={generateAfterSave}
                onChange={(e) => setGenerateAfterSave(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="generateAfterSave"
                className="ml-2 block text-sm text-gray-700"
              >
                Generate report after saving
              </label>
            </div>
          </div>

          <div className="flex justify-between mb-6">
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Advanced Filters
            </button>
            <button
              type="button"
              onClick={() => setShowChartCustomizer(true)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Customize Visualization
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Report"
              )}
            </button>
          </div>
        </form>

        {/* Advanced Filters Modal */}
        {showFilters && (
          <AdvancedFilters
            reportType={formData.type}
            initialFilters={formData.filters || {}}
            onClose={() => setShowFilters(false)}
            onSave={handleFiltersChange}
          />
        )}

        {/* Chart Customizer Modal */}
        {showChartCustomizer && (
          <ChartCustomizer
            reportType={formData.type}
            initialParameters={formData.parameters || {}}
            onClose={() => setShowChartCustomizer(false)}
            onSave={handleParametersChange}
          />
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;
