// API Error types
export interface ApiError {
 response?: {
  data?: {
   message?: string;
   error?: string;
   details?: any;
  };
  status?: number;
  statusText?: string;
 };
 message: string;
 code?: string;
 status?: number;
}

// API Response types
export interface ApiResponse<T = any> {
 data: T;
 message?: string;
 success: boolean;
 status: number;
}

// Pagination types
export interface PaginationParams {
 page?: number;
 limit?: number;
 sortBy?: string;
 sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
 data: T[];
 pagination: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
 };
}

// Filter types
export interface FilterParams {
 search?: string;
 status?: string;
 category?: string;
 dateFrom?: string;
 dateTo?: string;
 [key: string]: any;
}

// Request types
export interface CreateRequest<T> {
 data: T;
}

export interface UpdateRequest<T> {
 id: string;
 data: Partial<T>;
}

export interface DeleteRequest {
 id: string;
}

// Auth types
export interface LoginRequest {
 username: string;
 password: string;
 tenantId?: string;
}

export interface RegisterRequest {
 username: string;
 password: string;
 fullName: string;
 email: string;
 role: string;
 tenantId?: string;
}

export interface AuthResponse {
 user: {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  tenantId: string;
 };
 token: string;
 refreshToken?: string;
}

// File upload types
export interface FileUploadResponse {
 url: string;
 filename: string;
 size: number;
 mimetype: string;
}

export interface UploadProgress {
 loaded: number;
 total: number;
 percentage: number;
}
