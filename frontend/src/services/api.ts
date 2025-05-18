import axios from "axios";
import useAuthStore from "../store/authStore";

// Create an axios instance
const api = axios.create({
  baseURL: "/api", // Backend API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, log out the user
      useAuthStore.getState().logout();
      window.location.href = "/";
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
    preferredLanguage?: string
  ) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        password,
        fullName,
        role,
        email,
        preferredLanguage,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      // Just clear the token, no need for a server call
      return { success: true };
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
  getCategories: async () => {
    try {
      const response = await api.get("/menu/categories");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMenuItems: async () => {
    try {
      const response = await api.get("/menu/items");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMenuItemsByCategory: async (categoryId: string) => {
    try {
      const response = await api.get(`/menu/categories/${categoryId}/items`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createMenuItem: async (data: any) => {
    try {
      const response = await api.post("/menu/items", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMenuItem: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/menu/items/${id}`, data);
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

  updateTableStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/tables/${id}/status`, { status });
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
export const kitchenAPI = {
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

  getSales: async (period: string = "day") => {
    try {
      const response = await api.get(`/dashboard/sales?period=${period}`);
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

  getActiveOrders: async () => {
    try {
      const response = await api.get("/dashboard/active-orders");
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
  getStocks: async () => {
    try {
      const response = await api.get("/stock");
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

  adjustStock: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/stock/${id}/adjust`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
