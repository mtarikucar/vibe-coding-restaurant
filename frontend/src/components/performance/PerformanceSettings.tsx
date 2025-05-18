import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@headlessui/react";
import performanceMonitoringService from "../../services/performanceMonitoring";

interface PerformanceSettingsProps {
  onClose?: () => void;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  onClose,
}) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Initialize state from service
  useEffect(() => {
    // These would be actual methods if we had them in the service
    // For now we'll just use the state
    setEnabled(true);
    setDebugMode(false);
  }, []);

  // Handle enable/disable toggle
  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    performanceMonitoringService.setEnabled(checked);
  };

  // Handle debug mode toggle
  const handleDebugModeChange = (checked: boolean) => {
    setDebugMode(checked);
    performanceMonitoringService.setDebugMode(checked);
  };

  // Handle clear metrics
  const handleClearMetrics = () => {
    performanceMonitoringService.clearMetrics();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {t("performance.settings")}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Performance Monitoring */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {t("performance.settings.enableMonitoring")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("performance.settings.enableDescription")}
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={handleEnabledChange}
            className={`${
              enabled ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                enabled ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Debug Mode */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {t("performance.settings.debugMode")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("performance.settings.debugDescription")}
            </p>
          </div>
          <Switch
            checked={debugMode}
            onChange={handleDebugModeChange}
            className={`${
              debugMode ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                debugMode ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Clear Metrics Button */}
        <div className="pt-4">
          <button
            onClick={handleClearMetrics}
            className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition-colors"
          >
            {t("performance.settings.clearMetrics")}
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 p-4 rounded-md mt-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {t("performance.settings.about")}
          </h3>
          <p className="text-sm text-blue-700">
            {t("performance.settings.aboutDescription")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSettings;
