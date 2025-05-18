import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
