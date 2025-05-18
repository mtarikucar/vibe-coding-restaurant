import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "../services/api";
import socketService from "../services/socket";

export enum CampaignType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
  BUY_X_GET_Y = "buy_x_get_y",
  FREE_ITEM = "free_item",
}

export enum CampaignStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SCHEDULED = "scheduled",
  EXPIRED = "expired",
}

export enum CampaignApplicability {
  ALL_ITEMS = "all_items",
  SPECIFIC_ITEMS = "specific_items",
  SPECIFIC_CATEGORIES = "specific_categories",
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  value: number;
  status: CampaignStatus;
  applicability: CampaignApplicability;
  applicableItems?: string[];
  startDate?: Date;
  endDate?: Date;
  isRecurring: boolean;
  recurringDays?: number[];
  recurringStartTime?: string;
  recurringEndTime?: string;
  requiresCode: boolean;
  code?: string;
  usageLimit: number;
  usageCount: number;
  isDeleted: boolean;
  tenantId?: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: CampaignType;
  value: number;
  status?: CampaignStatus;
  applicability: CampaignApplicability;
  applicableItems?: string[];
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
  recurringDays?: number[];
  recurringStartTime?: string;
  recurringEndTime?: string;
  requiresCode?: boolean;
  code?: string;
  usageLimit?: number;
}

interface CampaignState {
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchActiveCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  createCampaign: (campaign: CreateCampaignDto) => Promise<Campaign | null>;
  updateCampaign: (
    id: string,
    campaign: Partial<CreateCampaignDto>
  ) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
  validateCampaignCode: (code: string) => Promise<Campaign | null>;
  applyCampaignToOrder: (
    campaignId: string,
    orderId: string
  ) => Promise<boolean>;
  clearError: () => void;
  setupSocketListeners: () => void;
}

export const useCampaignStore = create<CampaignState>()(
  devtools(
    (set, get) => ({
      campaigns: [],
      activeCampaigns: [],
      currentCampaign: null,
      isLoading: false,
      error: null,

      fetchCampaigns: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get("/campaigns");
          set({ campaigns: response.data, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch campaigns:", error);
          set({
            error: "Failed to fetch campaigns. Please try again.",
            isLoading: false,
          });
        }
      },

      fetchActiveCampaigns: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get("/campaigns/active");
          set({ activeCampaigns: response.data, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch active campaigns:", error);
          set({
            error: "Failed to fetch active campaigns. Please try again.",
            isLoading: false,
          });
        }
      },

      fetchCampaign: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get(`/campaigns/${id}`);
          set({ currentCampaign: response.data, isLoading: false });
        } catch (error) {
          console.error(`Failed to fetch campaign with ID ${id}:`, error);
          set({
            error: `Failed to fetch campaign. Please try again.`,
            isLoading: false,
          });
        }
      },

      createCampaign: async (campaign: CreateCampaignDto) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post("/campaigns", campaign);

          // Update campaigns list
          set((state) => ({
            campaigns: [...state.campaigns, response.data],
            isLoading: false,
          }));

          return response.data;
        } catch (error) {
          console.error("Failed to create campaign:", error);
          set({
            error: "Failed to create campaign. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      updateCampaign: async (
        id: string,
        campaign: Partial<CreateCampaignDto>
      ) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.patch(`/campaigns/${id}`, campaign);

          // Update campaigns list and current campaign
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === id ? response.data : c
            ),
            activeCampaigns: state.activeCampaigns.map((c) =>
              c.id === id ? response.data : c
            ),
            currentCampaign:
              state.currentCampaign?.id === id
                ? response.data
                : state.currentCampaign,
            isLoading: false,
          }));

          return response.data;
        } catch (error) {
          console.error(`Failed to update campaign with ID ${id}:`, error);
          set({
            error: "Failed to update campaign. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      deleteCampaign: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await api.delete(`/campaigns/${id}`);

          // Update campaigns list
          set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            activeCampaigns: state.activeCampaigns.filter((c) => c.id !== id),
            currentCampaign:
              state.currentCampaign?.id === id ? null : state.currentCampaign,
            isLoading: false,
          }));

          return true;
        } catch (error) {
          console.error(`Failed to delete campaign with ID ${id}:`, error);
          set({
            error: "Failed to delete campaign. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      validateCampaignCode: async (code: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post("/campaigns/validate-code", { code });
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          console.error("Failed to validate campaign code:", error);
          set({
            error: "Invalid campaign code. Please try again.",
            isLoading: false,
          });
          return null;
        }
      },

      applyCampaignToOrder: async (campaignId: string, orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          await api.post(`/campaigns/apply/${campaignId}/order/${orderId}`);
          set({ isLoading: false });
          return true;
        } catch (error) {
          console.error("Failed to apply campaign to order:", error);
          set({
            error: "Failed to apply campaign to order. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      setupSocketListeners: () => {
        // Listen for campaign events
        socketService.on("campaign:created", (campaign: Campaign) => {
          set((state) => ({
            campaigns: [...state.campaigns, campaign],
          }));
        });

        socketService.on("campaign:updated", (campaign: Campaign) => {
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaign.id ? campaign : c
            ),
            activeCampaigns: state.activeCampaigns.map((c) =>
              c.id === campaign.id ? campaign : c
            ),
            currentCampaign:
              state.currentCampaign?.id === campaign.id
                ? campaign
                : state.currentCampaign,
          }));
        });

        socketService.on("campaign:status", (campaign: Campaign) => {
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === campaign.id ? { ...c, status: campaign.status } : c
            ),
            activeCampaigns: state.activeCampaigns.map((c) =>
              c.id === campaign.id ? { ...c, status: campaign.status } : c
            ),
            currentCampaign:
              state.currentCampaign?.id === campaign.id
                ? { ...state.currentCampaign, status: campaign.status }
                : state.currentCampaign,
          }));
        });
      },
    }),
    { name: "campaign-store" }
  )
);
