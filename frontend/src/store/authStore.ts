import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "../services/api";

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "waiter"
  | "kitchen"
  | "cashier"
  | "inventory"
  | "marketing";

interface Tenant {
  id: string;
  name: string;
  displayName?: string;
  logo?: string;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  tenantId?: string;
  isSuperAdmin?: boolean;
  tenant?: Tenant | null;
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  GITHUB = "github",
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  authProvider: AuthProvider;
  isRefreshing: boolean;

  // For backward compatibility
  token: string | null;

  // Actions
  login: (
    user: User,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    provider?: AuthProvider
  ) => void;
  logout: (refreshToken?: string) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      authProvider: AuthProvider.LOCAL,
      isRefreshing: false,
      token: null,

      login: (
        user,
        accessToken,
        refreshToken,
        expiresIn,
        provider = AuthProvider.LOCAL
      ) => {
        // Calculate token expiration time
        const expiresAt = Date.now() + expiresIn * 1000;

        set({
          user,
          accessToken,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
          authProvider: provider,
          token: accessToken, // For backward compatibility
        });
      },

      logout: async (refreshToken?: string) => {
        try {
          // Call the API to revoke the refresh token
          if (get().isAuthenticated) {
            await authAPI.logout(refreshToken || get().refreshToken);
          }
        } catch (error) {
          console.error("Error during logout:", error);
        } finally {
          // Clear the auth state regardless of API success
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            authProvider: AuthProvider.LOCAL,
            token: null, // For backward compatibility
          });
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken, isRefreshing } = get();

        // If already refreshing or no refresh token, return null
        if (isRefreshing || !refreshToken) {
          return null;
        }

        try {
          set({ isRefreshing: true });

          // Call the API to refresh the token
          const response = await authAPI.refreshToken(refreshToken);

          // Update the tokens
          const {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn,
          } = response;
          get().setTokens(accessToken, newRefreshToken, expiresIn);

          return accessToken;
        } catch (error) {
          console.error("Failed to refresh token:", error);

          // If refresh fails, log the user out
          await get().logout();
          return null;
        } finally {
          set({ isRefreshing: false });
        }
      },

      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          accessToken,
          refreshToken,
          expiresAt,
          token: accessToken, // For backward compatibility
        });
      },
    }),
    {
      name: "auth-storage",
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
        authProvider: state.authProvider,
        token: state.token, // For backward compatibility
      }),
    }
  )
);

export default useAuthStore;
