import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCampaignStore,
  CampaignType,
  CampaignStatus,
  CampaignApplicability,
  type CreateCampaignDto,
} from "../../store/campaignStore";
import { Button } from "../../components/ui";
import { toast } from "react-hot-toast";

const CampaignForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentCampaign,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    isLoading,
    error,
  } = useCampaignStore();

  const isEditMode = !!id;

  const [formData, setFormData] = useState<CreateCampaignDto>({
    name: "",
    description: "",
    type: CampaignType.PERCENTAGE,
    value: 0,
    status: CampaignStatus.INACTIVE,
    applicability: CampaignApplicability.ALL_ITEMS,
    applicableItems: [],
    startDate: undefined,
    endDate: undefined,
    isRecurring: false,
    recurringDays: [],
    recurringStartTime: "",
    recurringEndTime: "",
    requiresCode: false,
    code: "",
    usageLimit: 0,
  });

  useEffect(() => {
    if (isEditMode && id) {
      fetchCampaign(id);
    }
  }, [isEditMode, id, fetchCampaign]);

  useEffect(() => {
    if (currentCampaign && isEditMode) {
      setFormData({
        name: currentCampaign.name,
        description: currentCampaign.description || "",
        type: currentCampaign.type,
        value: currentCampaign.value,
        status: currentCampaign.status,
        applicability: currentCampaign.applicability,
        applicableItems: currentCampaign.applicableItems || [],
        startDate: currentCampaign.startDate,
        endDate: currentCampaign.endDate,
        isRecurring: currentCampaign.isRecurring,
        recurringDays: currentCampaign.recurringDays || [],
        recurringStartTime: currentCampaign.recurringStartTime || "",
        recurringEndTime: currentCampaign.recurringEndTime || "",
        requiresCode: currentCampaign.requiresCode,
        code: currentCampaign.code || "",
        usageLimit: currentCampaign.usageLimit,
      });
    }
  }, [currentCampaign, isEditMode]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else if (name === "recurringDays") {
      const day = parseInt(value);
      const currentDays = [...(formData.recurringDays || [])];

      if (currentDays.includes(day)) {
        setFormData({
          ...formData,
          recurringDays: currentDays.filter((d) => d !== day),
        });
      } else {
        setFormData({
          ...formData,
          recurringDays: [...currentDays, day],
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && id) {
        await updateCampaign(id, formData);
        toast.success("Campaign updated successfully");
      } else {
        await createCampaign(formData);
        toast.success("Campaign created successfully");
      }

      navigate("/app/campaigns");
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error("Failed to save campaign");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Campaign" : "Create Campaign"}
        </h1>
      </div>

      {isLoading && !formData.name ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="col-span-2">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h2>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={CampaignStatus.ACTIVE}>Active</option>
                <option value={CampaignStatus.INACTIVE}>Inactive</option>
                <option value={CampaignStatus.SCHEDULED}>Scheduled</option>
              </select>
            </div>

            <div className="col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Discount Information */}
            <div className="col-span-2">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Discount Information
              </h2>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Discount Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={CampaignType.PERCENTAGE}>
                  Percentage Discount
                </option>
                <option value={CampaignType.FIXED_AMOUNT}>
                  Fixed Amount Discount
                </option>
                <option value={CampaignType.BUY_X_GET_Y}>Buy X Get Y</option>
                <option value={CampaignType.FREE_ITEM}>Free Item</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label
                htmlFor="value"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Value *
              </label>
              <input
                type="number"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                min={0}
                step={formData.type === CampaignType.PERCENTAGE ? 1 : 0.01}
                max={
                  formData.type === CampaignType.PERCENTAGE ? 100 : undefined
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-2 mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                {isLoading
                  ? "Processing..."
                  : isEditMode
                    ? "Update Campaign"
                    : "Create Campaign"
                }
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CampaignForm;
