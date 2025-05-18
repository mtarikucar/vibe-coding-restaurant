import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  useCampaignStore,
  CampaignStatus,
  CampaignType,
  type Campaign,
} from "../../store/campaignStore";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Skeleton from "../../components/common/Skeleton";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import { useToast } from "../../components/common/ToastProvider";

const Campaigns: React.FC = () => {
  const { t } = useTranslation();
  const {
    campaigns,
    fetchCampaigns,
    deleteCampaign,
    updateCampaign,
    isLoading,
    error,
  } = useCampaignStore();
  const customToast = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      customToast.error(error);
    }
  }, [error, customToast]);

  const handleDelete = async (id: string) => {
    if (window.confirm(t("campaigns.confirmDelete"))) {
      setIsDeleting(id);
      const success = await deleteCampaign(id);
      setIsDeleting(null);

      if (success) {
        toast.success(t("campaigns.campaignDeleted"));
        customToast.success(t("campaigns.campaignDeleted"));
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCampaigns();
      customToast.success(t("campaigns.campaignsRefreshed"));
    } catch (error) {
      customToast.error(t("campaigns.failedToRefresh"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    const success = await updateCampaign(id, { status });

    if (success) {
      const message =
        status === CampaignStatus.ACTIVE
          ? t("campaigns.campaignActivated")
          : t("campaigns.campaignDeactivated");
      toast.success(message);
      customToast.success(message);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="mr-1 h-4 w-4" />
            {t("campaigns.status.active")}
          </span>
        );
      case CampaignStatus.INACTIVE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="mr-1 h-4 w-4" />
            {t("campaigns.status.inactive")}
          </span>
        );
      case CampaignStatus.SCHEDULED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="mr-1 h-4 w-4" />
            {t("campaigns.status.scheduled")}
          </span>
        );
      case CampaignStatus.EXPIRED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="mr-1 h-4 w-4" />
            {t("campaigns.status.expired")}
          </span>
        );
      default:
        return null;
    }
  };

  const getCampaignTypeName = (type: CampaignType) => {
    switch (type) {
      case CampaignType.PERCENTAGE:
        return t("campaigns.types.percentage");
      case CampaignType.FIXED_AMOUNT:
        return t("campaigns.types.fixedAmount");
      case CampaignType.BUY_X_GET_Y:
        return t("campaigns.types.buyXGetY");
      case CampaignType.FREE_ITEM:
        return t("campaigns.types.freeItem");
      default:
        return type;
    }
  };

  const formatCampaignValue = (campaign: Campaign) => {
    switch (campaign.type) {
      case CampaignType.PERCENTAGE:
        return `${campaign.value}%`;
      case CampaignType.FIXED_AMOUNT:
        return `$${campaign.value.toFixed(2)}`;
      case CampaignType.BUY_X_GET_Y:
        return `${t("campaigns.types.buyXGetY").replace(
          "X",
          campaign.value.toString()
        )}`;
      case CampaignType.FREE_ITEM:
        return t("campaigns.types.freeItem");
      default:
        return campaign.value.toString();
    }
  };

  // Filter campaigns based on search term and filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description &&
        campaign.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (campaign.code &&
        campaign.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    const matchesType = typeFilter === "all" || campaign.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("campaigns.title")}</h1>
          <div className="flex space-x-2">
            <Skeleton width={120} height={40} className="rounded-md" />
          </div>
        </div>
        <Skeleton variant="table" height={400} className="w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">
              {t("errors.serverError")}
            </h3>
          </div>
          <div className="mt-2 text-sm text-red-700">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            {t("campaigns.actions.refresh")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("campaigns.title")}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isRefreshing}
              title={t("campaigns.actions.refresh")}
            >
              {isRefreshing ? (
                <LoadingSpinner size="sm" color="primary" />
              ) : (
                <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <Link
              to="/app/campaigns/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {t("campaigns.newCampaign")}
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t("campaigns.filters")}
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("common.search")}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder={t("campaigns.searchCampaigns")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("common.status")}
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">{t("campaigns.allStatuses")}</option>
                  <option value={CampaignStatus.ACTIVE}>
                    {t("campaigns.status.active")}
                  </option>
                  <option value={CampaignStatus.INACTIVE}>
                    {t("campaigns.status.inactive")}
                  </option>
                  <option value={CampaignStatus.SCHEDULED}>
                    {t("campaigns.status.scheduled")}
                  </option>
                  <option value={CampaignStatus.EXPIRED}>
                    {t("campaigns.status.expired")}
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("campaigns.campaignType")}
                </label>
                <select
                  id="type"
                  name="type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">{t("campaigns.allTypes")}</option>
                  <option value={CampaignType.PERCENTAGE}>
                    {t("campaigns.types.percentage")}
                  </option>
                  <option value={CampaignType.FIXED_AMOUNT}>
                    {t("campaigns.types.fixedAmount")}
                  </option>
                  <option value={CampaignType.BUY_X_GET_Y}>
                    {t("campaigns.types.buyXGetY")}
                  </option>
                  <option value={CampaignType.FREE_ITEM}>
                    {t("campaigns.types.freeItem")}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <TagIcon
              className="mx-auto h-12 w-12 text-gray-400"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t("campaigns.noCampaignsFound")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {campaigns.length === 0
                ? t("campaigns.getStarted")
                : t("campaigns.adjustFilters")}
            </p>
            {campaigns.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/app/campaigns/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {t("campaigns.newCampaign")}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <li key={campaign.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {campaign.name}
                        </p>
                        <div className="ml-2">
                          {getStatusBadge(campaign.status)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {campaign.status === CampaignStatus.INACTIVE && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                campaign.id,
                                CampaignStatus.ACTIVE
                              )
                            }
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title={t("campaigns.actions.activate")}
                          >
                            <CheckCircleIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                        {campaign.status === CampaignStatus.ACTIVE && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                campaign.id,
                                CampaignStatus.INACTIVE
                              )
                            }
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            title={t("campaigns.actions.deactivate")}
                          >
                            <XCircleIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                        <Link
                          to={`/app/campaigns/edit/${campaign.id}`}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title={t("campaigns.actions.edit")}
                        >
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          disabled={isDeleting === campaign.id}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title={t("campaigns.actions.delete")}
                        >
                          {isDeleting === campaign.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {getCampaignTypeName(campaign.type)}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {formatCampaignValue(campaign)}
                        </p>
                        {campaign.requiresCode && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {t("campaigns.code")}: {campaign.code}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        {campaign.startDate && (
                          <p className="flex items-center">
                            <CalendarIcon
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                            <span>
                              {format(
                                new Date(campaign.startDate),
                                "MMM d, yyyy"
                              )}
                              {campaign.endDate &&
                                ` - ${format(
                                  new Date(campaign.endDate),
                                  "MMM d, yyyy"
                                )}`}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Campaigns;
