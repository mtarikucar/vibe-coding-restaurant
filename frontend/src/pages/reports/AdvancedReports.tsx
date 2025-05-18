import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowPathIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import reportAPI, {
  Report,
  ReportTemplate,
  ReportSchedule,
  ReportType,
  ReportFormat,
  ReportStatus,
} from "../../services/reportApi";
import ReportBuilder from "../../components/reports/ReportBuilder";
import ReportTemplateSelector from "../../components/reports/ReportTemplateSelector";
import ReportScheduler from "../../components/reports/ReportScheduler";
import { formatDate } from "../../utils/formatters";
import { Tab } from "@headlessui/react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const AdvancedReports = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState({
    reports: false,
    templates: false,
    schedules: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  // Fetch data
  const fetchReports = async () => {
    setLoading((prev) => ({ ...prev, reports: true }));
    try {
      const data = await reportAPI.getAllReports();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const fetchTemplates = async () => {
    setLoading((prev) => ({ ...prev, templates: true }));
    try {
      const data = await reportAPI.getAllReportTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, templates: false }));
    }
  };

  const fetchSchedules = async () => {
    setLoading((prev) => ({ ...prev, schedules: true }));
    try {
      const data = await reportAPI.getAllReportSchedules();
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Failed to load schedules. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, schedules: false }));
    }
  };

  useEffect(() => {
    fetchReports();
    fetchTemplates();
    fetchSchedules();
  }, []);

  // Handle report actions
  const handleCreateReport = () => {
    setSelectedReport(null);
    setShowReportBuilder(true);
  };

  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportBuilder(true);
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await reportAPI.deleteReport(id);
        fetchReports();
      } catch (err) {
        console.error("Error deleting report:", err);
        setError("Failed to delete report. Please try again.");
      }
    }
  };

  const handleGenerateReport = async (id: string) => {
    try {
      const report = await reportAPI.generateReport({ reportId: id, type: ReportType.SALES });
      fetchReports();
      alert("Report generated successfully!");
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    }
  };

  const handleDownloadReport = (id: string) => {
    reportAPI.downloadReport(id);
  };

  const handleCreateFromTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleScheduleReport = (report: Report) => {
    setSelectedReport(report);
    setShowScheduler(true);
  };

  // Render report status badge
  const renderStatusBadge = (status: ReportStatus) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";

    switch (status) {
      case ReportStatus.GENERATED:
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case ReportStatus.SCHEDULED:
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case ReportStatus.FAILED:
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  // Render report type icon
  const renderTypeIcon = (type: ReportType) => {
    switch (type) {
      case ReportType.SALES:
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case ReportType.INVENTORY:
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case ReportType.USERS:
        return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case ReportType.ORDERS:
        return <DocumentTextIcon className="h-5 w-5 text-orange-500" />;
      case ReportType.PAYMENTS:
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
      case ReportType.CUSTOM:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              fetchReports();
              fetchTemplates();
              fetchSchedules();
            }}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreateReport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Report
          </button>
          <button
            onClick={handleCreateFromTemplate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            From Template
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Tab.Group onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white text-blue-700 shadow"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            My Reports
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white text-blue-700 shadow"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Templates
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white text-blue-700 shadow"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Scheduled Reports
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            {loading.reports ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : reports.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {renderTypeIcon(report.type)}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{report.name}</div>
                              <div className="text-sm text-gray-500">
                                {report.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.type}</div>
                          {report.template && (
                            <div className="text-xs text-gray-500">
                              Template: {report.template.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(report.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditReport(report)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleGenerateReport(report.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Generate"
                            >
                              <ChartBarIcon className="h-5 w-5" />
                            </button>
                            {report.fileUrl && (
                              <button
                                onClick={() => handleDownloadReport(report.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download"
                              >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleScheduleReport(report)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Schedule"
                            >
                              <ClockIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500 mb-4">
                  Create your first report to get started with advanced reporting.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleCreateReport}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Report
                  </button>
                  <button
                    onClick={handleCreateFromTemplate}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    From Template
                  </button>
                </div>
              </div>
            )}
          </Tab.Panel>
          <Tab.Panel>
            {/* Templates tab content */}
            {loading.templates ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.isSystem
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {template.isSystem ? "System" : "Custom"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        {template.description || "No description"}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="font-medium mr-2">Type:</span>
                        <span>{template.type}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="font-medium mr-2">Category:</span>
                        <span>{template.category}</span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            // Create report from template
                            setSelectedReport(null);
                            setShowReportBuilder(true);
                            // TODO: Pass template to report builder
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">
                  Create your first template to streamline your reporting process.
                </p>
                <button
                  onClick={() => {
                    // TODO: Show template creation form
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Template
                </button>
              </div>
            )}
          </Tab.Panel>
          <Tab.Panel>
            {/* Scheduled Reports tab content */}
            {loading.schedules ? (
              <div className="flex justify-center items-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : schedules.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Run
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-purple-500" />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                              <div className="text-sm text-gray-500">
                                {schedule.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{schedule.frequency}</div>
                          <div className="text-xs text-gray-500">
                            Delivery: {schedule.deliveryMethod}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {schedule.nextRunDate
                            ? formatDate(schedule.nextRunDate)
                            : "Not scheduled"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              schedule.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {schedule.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // TODO: Edit schedule
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Toggle active status
                              }}
                              className={`${
                                schedule.isActive
                                  ? "text-red-600 hover:text-red-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                              title={schedule.isActive ? "Deactivate" : "Activate"}
                            >
                              {schedule.isActive ? (
                                <span className="h-5 w-5">⏸</span>
                              ) : (
                                <span className="h-5 w-5">▶️</span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Delete schedule
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
                <p className="text-gray-500 mb-4">
                  Schedule reports to be generated and delivered automatically.
                </p>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setShowScheduler(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Schedule
                </button>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <ReportBuilder
          report={selectedReport}
          templates={templates}
          onClose={() => setShowReportBuilder(false)}
          onSave={() => {
            setShowReportBuilder(false);
            fetchReports();
          }}
        />
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <ReportTemplateSelector
          templates={templates}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={(template) => {
            setShowTemplateSelector(false);
            setSelectedReport(null);
            setShowReportBuilder(true);
            // TODO: Pass template to report builder
          }}
        />
      )}

      {/* Report Scheduler Modal */}
      {showScheduler && (
        <ReportScheduler
          report={selectedReport}
          onClose={() => setShowScheduler(false)}
          onSave={() => {
            setShowScheduler(false);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
};

export default AdvancedReports;
