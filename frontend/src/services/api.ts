/* eslint-disable no-useless-catch */
import axios from "axios";
import type { AxiosError } from "axios";
import useAuthStore from "../store/authStore";
import errorHandlingService, { ErrorType } from "./errorHandling";
import performanceMonitoringService from "./performanceMonitoring";

// Create an axios instance
const api = axios.create({
  baseURL: "/api", // Backend API URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore.getState();

    // For backward compatibility - check both token and accessToken
    const token = authStore.accessToken || authStore.token;

    // Check if token exists
    if (token) {
      // Check if token is expired and needs refresh
      if (authStore.expiresAt) {
        // Add 60 seconds buffer to ensure token doesn't expire during request
        const isExpiringSoon = authStore.expiresAt < Date.now() + 60000;

        if (isExpiringSoon && authStore.refreshToken) {
          try {
            // Try to refresh the token
            console.log("Token is expiring soon, attempting to refresh");
            const newToken = await authStore.refreshAccessToken();
            if (newToken) {
              // Use the new token
              console.log("Token refreshed successfully");
              config.headers.Authorization = `Bearer ${newToken}`;
            } else {
              // If refresh failed but not due to an error, use existing token
              console.log("Token refresh returned null, using existing token");
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error("Token refresh failed with error:", error);
            // If refresh failed with an error, redirect to login
            window.location.href = "/";
            return Promise.reject(new Error("Session expired"));
          }
        } else {
          // Token not expiring soon, use existing token
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // No expiration time (old format), use token as is
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add request ID for tracking
    const requestId = `${config.method}-${config.url}-${Date.now()}`;
    config.headers["X-Request-ID"] = requestId;

    // Track request start time with performance monitoring service
    performanceMonitoringService.startApiRequest(requestId);

    // Log request
    console.debug(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
      {
        data: config.data,
        params: config.params,
        requestId,
      }
    );

    return config;
  },
  (error) => {
    errorHandlingService.handleApiError(error, { phase: "request" });
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors and log responses
api.interceptors.response.use(
  (response) => {
    // Calculate request duration using performance monitoring service
    const requestId = response.config.headers["X-Request-ID"] as string;
    const duration = performanceMonitoringService.endApiRequest(requestId, {
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      size: JSON.stringify(response.data).length,
    });

    if (duration) {
      // Log response
      console.debug(
        `API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          data: response.data,
          duration: `${duration.toFixed(2)}ms`,
          requestId,
        }
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();

      // If we have a refresh token, try to refresh the access token
      if (
        authStore.refreshToken &&
        !error.config?.url?.includes("/auth/refresh")
      ) {
        try {
          // Try to refresh the token
          const newToken = await authStore.refreshAccessToken();

          if (newToken && error.config) {
            // Retry the original request with the new token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, log out
      await authStore.logout();
      window.location.href = "/";
    }

    // Log error with our error handling service
    const appError = errorHandlingService.handleApiError(error, {
      url: error.config?.url,
      method: error.config?.method,
      phase: "response",
    });

    // Show error toast for non-validation errors
    if (appError.type !== ErrorType.VALIDATION) {
      errorHandlingService.showErrorToast(appError);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (
    username: string,
    password: string,
    fullName: string,
    role: string,
    email?: string,
    preferredLanguage?: string,
    tenantId?: string
  ) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        password,
        fullName,
        role,
        email,
        preferredLanguage,
        tenantId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get available tenants for registration
  getAvailableTenants: async () => {
    try {
      const response = await api.get("/auth/tenants");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate tenant for registration
  validateTenant: async (tenantId: string) => {
    try {
      const response = await api.get(`/auth/tenants/${tenantId}/validate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async (refreshToken?: string) => {
    try {
      // Call the server to revoke the refresh token
      await api.post("/auth/logout", { refreshToken });
      return { success: true };
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if the server call fails, consider it a success from the client perspective
      return { success: true };
    }
  },

  refreshToken: async (refreshToken: string) => {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  oauthLogin: async (provider: string, code: string, redirectUri?: string) => {
    try {
      const response = await api.post("/auth/oauth/login", {
        provider,
        code,
        redirectUri,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get("/auth/users");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUser: async (id: string) => {
    try {
      const response = await api.get(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/auth/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Password reset methods
  requestPasswordReset: async (email: string) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyResetToken: async (token: string) => {
    try {
      const response = await api.post("/auth/verify-reset-token", { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (
    token: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Menu API
export const menuAPI = {
  getCategories: async (tenantId?: string) => {
    try {
      // If tenantId is provided, use it for public access
      if (tenantId) {
        // Create a new axios instance for public access without auth headers
        const publicApi = axios.create({
          baseURL: "/api",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
          },
          timeout: 30000,
        });
        const response = await publicApi.get("/menu/categories");
        return response.data;
      } else {
        // Use authenticated API
        const response = await api.get("/menu/categories");
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },

  getMenuItems: async (tenantId?: string) => {
    try {
      // If tenantId is provided, use it for public access
      if (tenantId) {
        // Create a new axios instance for public access without auth headers
        const publicApi = axios.create({
          baseURL: "/api",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
          },
          timeout: 30000,
        });
        const response = await publicApi.get("/menu/items");
        return response.data;
      } else {
        // Use authenticated API
        const response = await api.get("/menu/items");
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },

  getMenuItemsByCategory: async (categoryId: string, tenantId?: string) => {
    try {
      // If tenantId is provided, use it for public access
      if (tenantId) {
        // Create a new axios instance for public access without auth headers
        const publicApi = axios.create({
          baseURL: "/api",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
          },
          timeout: 30000,
        });
        const response = await publicApi.get(
          `/menu/categories/${categoryId}/items`
        );
        return response.data;
      } else {
        // Use authenticated API
        const response = await api.get(`/menu/categories/${categoryId}/items`);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },

  createMenuItem: async (data: any) => {
    try {
      // Clean menu item data - remove backend-only fields
      const cleanData = { ...data };
      delete cleanData.id;
      delete cleanData.tenantId;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.category;
      delete cleanData.imageFile;

      console.log("Sending menu item to backend:", cleanData);

      const response = await api.post("/menu/items", cleanData);
      return response.data;
    } catch (error) {
      console.error("Error creating menu item:", error);
      throw error;
    }
  },

  updateMenuItem: async (id: string, data: any) => {
    try {
      // Clean menu item data - remove backend-only fields
      const cleanData = { ...data };
      delete cleanData.tenantId;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.category;
      delete cleanData.imageFile;

      const response = await api.patch(`/menu/items/${id}`, cleanData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteMenuItem: async (id: string) => {
    try {
      const response = await api.delete(`/menu/items/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategories: async (categories: any[]) => {
    try {
      // Clean categories data - remove backend-only fields
      const cleanCategories = categories.map((category) => {
        const cleanCategory = { ...category };
        delete cleanCategory.tenantId;
        delete cleanCategory.createdAt;
        delete cleanCategory.updatedAt;
        return cleanCategory;
      });

      console.log("Sending categories to backend:", cleanCategories);

      const response = await api.post("/menu/categories/batch", {
        categories: cleanCategories,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating categories:", error);
      throw error;
    }
  },
};

// Table API
export const tableAPI = {
  getTables: async () => {
    try {
      const response = await api.get("/tables");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTable: async (id: string) => {
    try {
      const response = await api.get(`/tables/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTable: async (tableData: any) => {
    try {
      const response = await api.post("/tables", tableData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTable: async (id: string, tableData: any) => {
    try {
      const response = await api.patch(`/tables/${id}`, tableData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTable: async (id: string) => {
    try {
      const response = await api.delete(`/tables/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTableStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/tables/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTablesByStatus: async (status: string) => {
    try {
      const response = await api.get(`/tables/status/${status}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Order API
export const orderAPI = {
  getOrders: async () => {
    try {
      const response = await api.get("/orders");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getOrder: async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createOrder: async (data: any) => {
    try {
      const response = await api.post("/orders", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateOrderStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateOrderItemStatus: async (
    orderId: string,
    itemId: string,
    status: string
  ) => {
    try {
      const response = await api.patch(
        `/orders/${orderId}/items/${itemId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Kitchen API
// Tenant API
export const tenantAPI = {
  registerTenant: async (tenantData: any, adminData: any) => {
    try {
      // First create the tenant
      const tenantResponse = await api.post("/tenants", tenantData);

      // Then create the admin user for this tenant
      const adminResponse = await api.post("/auth/register", {
        ...adminData,
        tenantId: tenantResponse.data.id,
      });

      return {
        tenant: tenantResponse.data,
        admin: adminResponse.data,
      };
    } catch (error) {
      throw error;
    }
  },

  getTenants: async () => {
    try {
      const response = await api.get("/tenants");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTenant: async (id: string) => {
    try {
      const response = await api.get(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTenant: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTenant: async (id: string) => {
    try {
      const response = await api.delete(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/* export const kitchenAPI = {
  getActiveOrders: async () => {
    try {
      const response = await api.get("/kitchen/orders");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateOrderItemStatus: async (
    orderId: string,
    itemId: string,
    status: string
  ) => {
    try {
      const response = await api.patch(
        `/kitchen/orders/${orderId}/items/${itemId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
 */
// Payment API
export const paymentAPI = {
  getPayments: async () => {
    try {
      const response = await api.get("/payments");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPayment: async (id: string) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPaymentByOrder: async (orderId: string) => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPayment: async (
    orderId: string,
    method: string,
    cashierId?: string
  ) => {
    try {
      const response = await api.post("/payments", {
        orderId,
        method,
        cashierId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  processPayment: async (
    paymentId: string,
    method: string,
    paymentMethodId?: string,
    paymentIntentId?: string,
    cashierId?: string
  ) => {
    try {
      const response = await api.post(`/payments/${paymentId}/process`, {
        method,
        paymentMethodId,
        paymentIntentId,
        cashierId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePaymentStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/payments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (period: string = "day") => {
    try {
      const response = await api.get(`/dashboard/stats?period=${period}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSales: async (
    period: string = "day",
    startDate?: string,
    endDate?: string
  ) => {
    try {
      let url = `/dashboard/sales?period=${period}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSalesComparison: async (currentPeriod: string, previousPeriod: string) => {
    try {
      const response = await api.get(
        `/dashboard/sales-comparison?currentPeriod=${currentPeriod}&previousPeriod=${previousPeriod}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPopularItems: async (limit: number = 5) => {
    try {
      const response = await api.get(`/dashboard/popular-items?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getItemSalesBreakdown: async (itemId: string, period: string = "month") => {
    try {
      const response = await api.get(
        `/dashboard/item-sales/${itemId}?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCategorySales: async (period: string = "month") => {
    try {
      const response = await api.get(
        `/dashboard/category-sales?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActiveOrders: async () => {
    try {
      const response = await api.get("/dashboard/active-orders");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getOrderStats: async (period: string = "day") => {
    try {
      const response = await api.get(`/dashboard/order-stats?period=${period}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCustomReport: async (
    startDate: string,
    endDate: string,
    type: string = "sales"
  ) => {
    try {
      const response = await api.get(
        `/dashboard/custom-report?startDate=${startDate}&endDate=${endDate}&type=${type}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getHourlyStats: async (date: string) => {
    try {
      const response = await api.get(`/dashboard/hourly-stats?date=${date}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStaffPerformance: async (period: string = "week") => {
    try {
      const response = await api.get(
        `/dashboard/staff-performance?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  exportSalesReport: async (startDate: string, endDate: string) => {
    try {
      // Using window.open for direct download
      window.open(
        `${api.defaults.baseURL}/dashboard/export-sales?startDate=${startDate}&endDate=${endDate}`,
        "_blank"
      );
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  exportInventoryReport: async () => {
    try {
      // Using window.open for direct download
      window.open(
        `${api.defaults.baseURL}/dashboard/export-inventory`,
        "_blank"
      );
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

// Stock API
export const stockAPI = {
  // Stock Items
  getStocks: async () => {
    try {
      const response = await api.get("/stock");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStock: async (id: string) => {
    try {
      const response = await api.get(`/stock/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getLowStock: async () => {
    try {
      const response = await api.get("/stock/low-stock");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCriticalStock: async () => {
    try {
      const response = await api.get("/stock/critical-stock");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  adjustStock: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/stock/${id}/adjust`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStockHistory: async (id: string) => {
    try {
      const response = await api.get(`/stock/${id}/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStockUsage: async (id: string, startDate?: string, endDate?: string) => {
    try {
      let url = `/stock/${id}/usage`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStockForecast: async (id: string, days?: number) => {
    try {
      let url = `/stock/${id}/forecast`;
      if (days) {
        url += `?days=${days}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStockValuation: async () => {
    try {
      const response = await api.get("/stock/valuation");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPurchaseSuggestions: async () => {
    try {
      const response = await api.get("/stock/purchase-suggestions");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      const response = await api.get("/suppliers");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSupplier: async (id: string) => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createSupplier: async (data: any) => {
    try {
      const response = await api.post("/suppliers", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSupplier: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteSupplier: async (id: string) => {
    try {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Purchase Orders
  getPurchaseOrders: async () => {
    try {
      const response = await api.get("/purchase-orders");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPurchaseOrder: async (id: string) => {
    try {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createPurchaseOrder: async (data: any) => {
    try {
      const response = await api.post("/purchase-orders", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePurchaseOrder: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/purchase-orders/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deletePurchaseOrder: async (id: string) => {
    try {
      const response = await api.delete(`/purchase-orders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  receivePurchaseOrder: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/purchase-orders/${id}/receive`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Campaign API
export const campaignAPI = {
  getCampaigns: async () => {
    try {
      const response = await api.get("/campaigns");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getActiveCampaigns: async () => {
    try {
      const response = await api.get("/campaigns/active");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCampaign: async (id: string) => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createCampaign: async (data: any) => {
    try {
      const response = await api.post("/campaigns", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCampaign: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/campaigns/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCampaign: async (id: string) => {
    try {
      const response = await api.delete(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  validateCampaignCode: async (code: string) => {
    try {
      const response = await api.post("/campaigns/validate-code", { code });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  applyCampaignToOrder: async (campaignId: string, orderId: string) => {
    try {
      const response = await api.post(
        `/campaigns/apply/${campaignId}/order/${orderId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadNotifications: async () => {
    try {
      const response = await api.get("/notifications/unread");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post("/notifications/read-all");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  archiveNotification: async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/archive`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getNotificationPreferences: async () => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateNotificationPreference: async (id: string, data: any) => {
    try {
      const response = await api.patch(
        `/notifications/preferences/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createDefaultPreferences: async () => {
    try {
      const response = await api.post("/notifications/preferences/default");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Push notification endpoints
  getVapidPublicKey: async () => {
    try {
      const response = await api.get("/notifications/vapid-public-key");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  savePushSubscription: async (subscription: PushSubscription) => {
    try {
      const response = await api.post("/notifications/subscriptions", {
        subscription: JSON.stringify(subscription),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deletePushSubscription: async (subscription: PushSubscription) => {
    try {
      const response = await api.delete("/notifications/subscriptions", {
        data: { subscription: JSON.stringify(subscription) },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPushSubscriptionStatus: async () => {
    try {
      const response = await api.get("/notifications/subscriptions/status");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Kitchen API
export const kitchenAPI = {
  getActiveOrders: async () => {
    try {
      const response = await api.get("/kitchen/orders");
      return response.data;
    } catch (error) {
      console.error("Error fetching active orders:", error);
      // Fallback to orderAPI if kitchen endpoint fails
      const allOrders = await orderAPI.getOrders();
      return allOrders.filter(
        (order) => order.status === "pending" || order.status === "preparing"
      );
    }
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const response = await api.patch(`/kitchen/orders/${orderId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating order status in kitchen API:", error);
      // Fallback to orderAPI
      return orderAPI.updateOrderStatus(orderId, status);
    }
  },
  updateOrderItemStatus: async (
    orderId: string,
    itemId: string,
    status: string
  ) => {
    try {
      const response = await api.patch(
        `/kitchen/orders/${orderId}/items/${itemId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order item status in kitchen API:", error);
      // Fallback to orderAPI
      return orderAPI.updateOrderItemStatus(orderId, itemId, status);
    }
  },
};

export default api;
