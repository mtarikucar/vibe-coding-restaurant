import api from "./api";

export enum ReportType {
  SALES = "sales",
  INVENTORY = "inventory",
  USERS = "users",
  ORDERS = "orders",
  PAYMENTS = "payments",
  CUSTOM = "custom",
}

export enum ReportFormat {
  PDF = "pdf",
  CSV = "csv",
  EXCEL = "excel",
  JSON = "json",
  HTML = "html",
}

export enum ReportStatus {
  DRAFT = "draft",
  GENERATED = "generated",
  SCHEDULED = "scheduled",
  FAILED = "failed",
}

export enum TemplateCategory {
  FINANCIAL = "financial",
  OPERATIONAL = "operational",
  ANALYTICAL = "analytical",
  CUSTOM = "custom",
}

export enum ScheduleFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
  CUSTOM = "custom",
}

export enum DeliveryMethod {
  EMAIL = "email",
  DOWNLOAD = "download",
  NOTIFICATION = "notification",
}

// Report interface moved to types/report.types.ts

// ReportTemplate and ReportSchedule interfaces moved to types/report.types.ts

export interface CreateReportDto {
  name: string;
  description?: string;
  type: ReportType;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  format?: ReportFormat;
  isPublic?: boolean;
  templateId?: string;
  scheduleId?: string;
}

// Renamed to avoid potential conflicts
export interface ReportGenerateDto {
  reportId?: string;
  templateId?: string;
  type: ReportType;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  format?: ReportFormat;
}

export interface CreateReportTemplateDto {
  name: string;
  description?: string;
  type: ReportType;
  category?: TemplateCategory;
  structure: Record<string, any>;
  defaultParameters?: Record<string, any>;
  visualizationOptions?: Record<string, any>;
  isActive?: boolean;
}

export interface CreateReportScheduleDto {
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: Record<string, any>;
  nextRunDate?: string;
  isActive?: boolean;
  deliveryMethod: DeliveryMethod;
  deliveryConfig?: Record<string, any>;
  format?: ReportFormat;
  recipients?: string[];
}

// Report API
const reportAPI = {
  // Reports
  createReport: async (data: CreateReportDto) => {
    try {
      const response = await api.post("/reports", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllReports: async () => {
    try {
      const response = await api.get("/reports");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getReportById: async (id: string) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateReport: async (id: string, data: Partial<CreateReportDto>) => {
    try {
      const response = await api.patch(`/reports/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteReport: async (id: string) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Report Templates
  createReportTemplate: async (data: CreateReportTemplateDto) => {
    try {
      const response = await api.post("/reports/templates", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllReportTemplates: async () => {
    try {
      const response = await api.get("/reports/templates");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Report Schedules
  createReportSchedule: async (data: CreateReportScheduleDto) => {
    try {
      const response = await api.post("/reports/schedules", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllReportSchedules: async () => {
    try {
      const response = await api.get("/reports/schedules");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Report Generation
  generateReport: async (data: ReportGenerateDto) => {
    try {
      const response = await api.post("/reports/generate", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download report
  downloadReport: (id: string) => {
    window.open(`${api.defaults.baseURL}/reports/download/${id}`, "_blank");
  },
};

export default reportAPI;
