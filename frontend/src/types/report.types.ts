import {
  ReportType,
  ReportStatus,
  ReportFormat,
  TemplateCategory,
  ScheduleFrequency,
  DeliveryMethod,
} from "../services/reportApi";

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  category: TemplateCategory;
  structure: Record<string, any>;
  defaultParameters?: Record<string, any>;
  visualizationOptions?: Record<string, any>;
  isSystem: boolean;
  isActive: boolean;
  createdById: string;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: Record<string, any>;
  nextRunDate?: string;
  lastRunDate?: string;
  isActive: boolean;
  deliveryMethod: DeliveryMethod;
  deliveryConfig?: Record<string, any>;
  format: ReportFormat;
  recipients?: string[];
  createdById: string;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  data?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  generatedAt?: string;
  fileUrl?: string;
  format: ReportFormat;
  isPublic: boolean;
  isFavorite: boolean;
  createdById: string;
  createdBy?: any;
  templateId?: string;
  template?: ReportTemplate;
  scheduleId?: string;
  schedule?: ReportSchedule;
  createdAt: string;
  updatedAt: string;
}
