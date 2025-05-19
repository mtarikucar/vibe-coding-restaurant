export enum ReportStatus {
  DRAFT = "draft",
  GENERATED = "generated",
  SCHEDULED = "scheduled",
  FAILED = "failed",
}

export enum ReportFormat {
  PDF = "pdf",
  CSV = "csv",
  EXCEL = "excel",
  JSON = "json",
  HTML = "html",
}

export enum ReportType {
  SALES = "sales",
  INVENTORY = "inventory",
  USERS = "users",
  ORDERS = "orders",
  PAYMENTS = "payments",
  CUSTOM = "custom",
}

export enum TemplateCategory {
  FINANCIAL = "financial",
  OPERATIONAL = "operational",
  ANALYTICAL = "analytical",
  CUSTOM = "custom",
}
