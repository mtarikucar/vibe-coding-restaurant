import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import reportAPI, {
  Report,
  ReportFormat,
  CreateReportScheduleDto,
  ScheduleFrequency,
  DeliveryMethod,
} from "../../services/reportApi";

interface ReportSchedulerProps {
  report: Report | null;
  onClose: () => void;
  onSave: () => void;
}

const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  report,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CreateReportScheduleDto>({
    name: "",
    description: "",
    frequency: ScheduleFrequency.WEEKLY,
    deliveryMethod: DeliveryMethod.EMAIL,
    format: ReportFormat.PDF,
    isActive: true,
    recipients: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [nextRunDate, setNextRunDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (report) {
      setFormData((prev) => ({
        ...prev,
        name: `${report.name} Schedule`,
        description: `Scheduled report for ${report.name}`,
      }));
    }
  }, [report]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNextRunDate(e.target.value);
  };

  const handleAddRecipient = () => {
    if (recipientEmail && isValidEmail(recipientEmail)) {
      if (!formData.recipients) {
        setFormData((prev) => ({ ...prev, recipients: [recipientEmail] }));
      } else if (!formData.recipients.includes(recipientEmail)) {
        setFormData((prev) => ({
          ...prev,
          recipients: [...prev.recipients!, recipientEmail],
        }));
      }
      setRecipientEmail("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients?.filter((r) => r !== email),
    }));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const scheduleData = {
        ...formData,
        nextRunDate,
      };

      const schedule = await reportAPI.createReportSchedule(scheduleData);

      if (report) {
        // Link schedule to report
        await reportAPI.updateReport(report.id, { scheduleId: schedule.id });
      }

      onSave();
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError("Failed to create schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Schedule Report
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
                Schedule Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter schedule name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ScheduleFrequency.DAILY}>Daily</option>
                <option value={ScheduleFrequency.WEEKLY}>Weekly</option>
                <option value={ScheduleFrequency.MONTHLY}>Monthly</option>
                <option value={ScheduleFrequency.QUARTERLY}>Quarterly</option>
                <option value={ScheduleFrequency.YEARLY}>Yearly</option>
                <option value={ScheduleFrequency.CUSTOM}>Custom</option>
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
              placeholder="Enter schedule description"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Run Date *
              </label>
              <input
                type="date"
                name="nextRunDate"
                value={nextRunDate}
                onChange={handleDateChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method *
              </label>
              <select
                name="deliveryMethod"
                value={formData.deliveryMethod}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={DeliveryMethod.EMAIL}>Email</option>
                <option value={DeliveryMethod.DOWNLOAD}>Download</option>
                <option value={DeliveryMethod.NOTIFICATION}>
                  Notification
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Format
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
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Active (schedule will run automatically)
              </label>
            </div>
          </div>

          {formData.deliveryMethod === DeliveryMethod.EMAIL && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <div className="flex">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
              {formData.recipients && formData.recipients.length > 0 && (
                <div className="mt-2">
                  <ul className="bg-gray-50 rounded-md p-2">
                    {formData.recipients.map((email) => (
                      <li
                        key={email}
                        className="flex justify-between items-center py-1"
                      >
                        <span className="text-sm text-gray-700">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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
                "Create Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportScheduler;
