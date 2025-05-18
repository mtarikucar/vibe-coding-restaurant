import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  NotificationType,
  NotificationChannel,
  type NotificationPreference,
} from "../types/notification";
import api from "../services/api";

interface NotificationPreferenceState {
  preferences: NotificationPreference[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPreferences: () => Promise<void>;
  updatePreference: (id: string, enabled: boolean) => Promise<void>;
  createDefaultPreferences: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationPreferenceStore =
  create<NotificationPreferenceState>()(
    devtools(
      (set) => ({
        preferences: [],
        isLoading: false,
        error: null,

        fetchPreferences: async () => {
          try {
            set({ isLoading: true, error: null });
            console.log("Fetching notification preferences...");
            const response = await api.get("/notifications/preferences");
            console.log("Notification preferences response:", response.data);
            set({ preferences: response.data, isLoading: false });
          } catch (error: any) {
            console.error("Failed to fetch notification preferences:", error);
            const errorMessage =
              error.response?.data?.message ||
              "Failed to load notification preferences. Please try again.";
            console.error("Error details:", errorMessage);
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        },

        updatePreference: async (id: string, enabled: boolean) => {
          try {
            set({ isLoading: true, error: null });
            console.log(
              `Updating notification preference ${id} to enabled=${enabled}...`
            );
            const updateResponse = await api.patch(
              `/notifications/preferences/${id}`,
              { enabled }
            );
            console.log("Update preference response:", updateResponse.data);

            // Update local state
            set((state) => ({
              preferences: state.preferences.map((pref) =>
                pref.id === id ? { ...pref, enabled } : pref
              ),
              isLoading: false,
            }));
          } catch (error: any) {
            console.error("Failed to update notification preference:", error);
            const errorMessage =
              error.response?.data?.message ||
              "Failed to update preference. Please try again.";
            console.error("Error details:", errorMessage);
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        },

        createDefaultPreferences: async () => {
          try {
            set({ isLoading: true, error: null });
            console.log("Creating default notification preferences...");
            const createResponse = await api.post(
              "/notifications/preferences/default"
            );
            console.log(
              "Create default preferences response:",
              createResponse.data
            );

            // Fetch updated preferences
            console.log("Fetching updated preferences after creation...");
            const response = await api.get("/notifications/preferences");
            console.log("Updated preferences response:", response.data);
            set({ preferences: response.data, isLoading: false });
          } catch (error: any) {
            console.error("Failed to create default preferences:", error);
            const errorMessage =
              error.response?.data?.message ||
              "Failed to create default preferences. Please try again.";
            console.error("Error details:", errorMessage);
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      { name: "notification-preference-store" }
    )
  );
