import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import { ChartBarIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import PerformanceDashboard from "../../components/performance/PerformanceDashboard";
import PerformanceSettings from "../../components/performance/PerformanceSettings";
import { useTranslation } from "react-i18next";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const PerformanceMonitoring: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t("performance.title")}
      </h1>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            <div className="flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {t("performance.dashboard")}
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            <div className="flex items-center justify-center">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              {t("performance.settings")}
            </div>
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <PerformanceDashboard />
          </Tab.Panel>
          <Tab.Panel>
            <div className="max-w-3xl mx-auto">
              <PerformanceSettings />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PerformanceMonitoring;
