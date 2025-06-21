import { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
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
 XMarkIcon,
} from"@heroicons/react/24/outline";
import reportAPI, {
 ReportType,
 ReportFormat,
 ReportStatus,
 TemplateCategory,
 type CreateReportTemplateDto,
} from"../../services/reportApi";
import {
 type Report,
 type ReportTemplate,
 type ReportSchedule,
} from"../../types/report.types";
import ReportBuilder from"../../components/reports/ReportBuilder";
import ReportTemplateSelector from"../../components/reports/ReportTemplateSelector";
import ReportScheduler from"../../components/reports/ReportScheduler";
import { formatDate } from"../../utils/formatters";
import { Tab } from"@headlessui/react";

function classNames(...classes: string[]) {
 return classes.filter(Boolean).join("");
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
 const [showTemplateForm, setShowTemplateForm] = useState(false);
 const [templateFormData, setTemplateFormData] =
  useState<CreateReportTemplateDto>({
   name:"",
   description:"",
   type: ReportType.SALES,
   category: TemplateCategory.FINANCIAL,
   structure: {},
   defaultParameters: {},
   visualizationOptions: {},
   isActive: true,
  });

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
   const report = await reportAPI.generateReport({
    reportId: id,
    type: ReportType.SALES,
   });
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

 const handleCreateTemplate = () => {
  setTemplateFormData({
   name:"",
   description:"",
   type: ReportType.SALES,
   category: TemplateCategory.FINANCIAL,
   structure: {},
   defaultParameters: {},
   visualizationOptions: {},
   isActive: true,
  });
  setShowTemplateForm(true);
 };

 const handleTemplateFormChange = (
  e: React.ChangeEvent<
   HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >
 ) => {
  const { name, value } = e.target;
  setTemplateFormData((prev) => ({ ...prev, [name]: value }));
 };

 const handleTemplateFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading((prev) => ({ ...prev, templates: true }));
  setError(null);

  try {
   await reportAPI.createReportTemplate(templateFormData);
   setShowTemplateForm(false);
   fetchTemplates();
  } catch (err) {
   console.error("Error creating template:", err);
   setError("Failed to create template. Please try again.");
  } finally {
   setLoading((prev) => ({ ...prev, templates: false }));
  }
 };

 // Render report status badge
 const renderStatusBadge = (status: ReportStatus) => {
  let bgColor ="bg-gray-100";
  let textColor ="text-gray-800";

  switch (status) {
   case ReportStatus.GENERATED:
    bgColor ="bg-green-100";
    textColor ="text-green-800";
    break;
   case ReportStatus.SCHEDULED:
    bgColor ="bg-blue-100";
    textColor ="text-blue-800";
    break;
   case ReportStatus.FAILED:
    bgColor ="bg-red-100";
    textColor ="text-red-800";
    break;
   default:
    bgColor ="bg-gray-100";
    textColor ="text-gray-800";
  }

  return (
   <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
   >
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
         ?"bg-white text-blue-700 shadow"
         :"text-blue-100 hover:bg-white/[0.12] hover:text-white"
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
         ?"bg-white text-blue-700 shadow"
         :"text-blue-100 hover:bg-white/[0.12] hover:text-white"
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
         ?"bg-white text-blue-700 shadow"
         :"text-blue-100 hover:bg-white/[0.12] hover:text-white"
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
               <div className="text-sm font-medium text-gray-900">
                {report.name}
               </div>
               <div className="text-sm text-gray-500">
                {report.description ||"No description"}
               </div>
              </div>
             </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
             <div className="text-sm text-gray-900">
              {report.type}
             </div>
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
         No reports found
        </h3>
        <p className="text-gray-500 mb-4">
         Create your first report to get started with advanced
         reporting.
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
            <h3 className="text-lg font-medium text-gray-900">
             {template.name}
            </h3>
            <span
             className={`px-2 py-1 rounded-full text-xs font-medium ${
              template.isSystem
               ?"bg-purple-100 text-purple-800"
               :"bg-blue-100 text-blue-800"
             }`}
            >
             {template.isSystem ?"System" : "Custom"}
            </span>
           </div>
           <p className="text-sm text-gray-500 mb-4">
            {template.description ||"No description"}
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
              setSelectedReport({
               ...templateFormData,
               id:"",
               status: ReportStatus.DRAFT,
               format: ReportFormat.PDF,
               isPublic: false,
               isFavorite: false,
               createdById:"",
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               templateId: template.id,
               template: template,
              } as Report);
              setShowReportBuilder(true);
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
         No templates found
        </h3>
        <p className="text-gray-500 mb-4">
         Create your first template to streamline your reporting
         process.
        </p>
        <button
         onClick={handleCreateTemplate}
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
               <div className="text-sm font-medium text-gray-900">
                {schedule.name}
               </div>
               <div className="text-sm text-gray-500">
                {schedule.description ||"No description"}
               </div>
              </div>
             </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
             <div className="text-sm text-gray-900">
              {schedule.frequency}
             </div>
             <div className="text-xs text-gray-500">
              Delivery: {schedule.deliveryMethod}
             </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
             {schedule.nextRunDate
              ? formatDate(schedule.nextRunDate)
              :"Not scheduled"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
             <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
               schedule.isActive
                ?"bg-green-100 text-green-800"
                :"bg-gray-100 text-gray-800"
              }`}
             >
              {schedule.isActive ?"Active" : "Inactive"}
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
                 ?"text-red-600 hover:text-red-900"
                 :"text-green-600 hover:text-green-900"
               }`}
               title={
                schedule.isActive ?"Deactivate" : "Activate"
               }
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
         No scheduled reports
        </h3>
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
      setSelectedReport({
       id:"",
       name: template.name,
       description: template.description,
       type: template.type,
       status: ReportStatus.DRAFT,
       format: ReportFormat.PDF,
       isPublic: false,
       isFavorite: false,
       createdById:"",
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       templateId: template.id,
       template: template,
       parameters: template.defaultParameters || {},
      } as Report);
      setShowReportBuilder(true);
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

   {/* Template Creation Modal */}
   {showTemplateForm && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
     <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
       <h2 className="text-xl font-semibold text-gray-800">
        Create Report Template
       </h2>
       <button
        onClick={() => setShowTemplateForm(false)}
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

      <form onSubmit={handleTemplateFormSubmit} className="p-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name *
         </label>
         <input
          type="text"
          name="name"
          value={templateFormData.name}
          onChange={handleTemplateFormChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter template name"
         />
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">
          Report Type *
         </label>
         <select
          name="type"
          value={templateFormData.type}
          onChange={handleTemplateFormChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
         >
          <option value={ReportType.SALES}>Sales Report</option>
          <option value={ReportType.INVENTORY}>
           Inventory Report
          </option>
          <option value={ReportType.USERS}>
           User Activity Report
          </option>
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
         value={templateFormData.description}
         onChange={handleTemplateFormChange}
         rows={3}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
         placeholder="Enter template description"
        ></textarea>
       </div>

       <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
         Category
        </label>
        <select
         name="category"
         value={templateFormData.category}
         onChange={handleTemplateFormChange}
         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
         <option value={TemplateCategory.FINANCIAL}>Financial</option>
         <option value={TemplateCategory.OPERATIONAL}>
          Operational
         </option>
         <option value={TemplateCategory.ANALYTICAL}>
          Analytical
         </option>
         <option value={TemplateCategory.CUSTOM}>Custom</option>
        </select>
       </div>

       <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
         type="button"
         onClick={() => setShowTemplateForm(false)}
         className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
         disabled={loading.templates}
        >
         Cancel
        </button>
        <button
         type="submit"
         className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
         disabled={loading.templates}
        >
         {loading.templates ? (
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
           Creating...
          </span>
         ) : (
         "Create Template"
         )}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
};

export default AdvancedReports;
