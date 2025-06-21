import api from './api';
import errorHandlingService from './errorHandling';

/**
 * Helper function to make API calls with error handling
 * @param apiCall - Function that makes the API call
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiCall<T>(
 apiCall: () => Promise<{ data: T }>,
 context?: Record<string, any>
): Promise<T> {
 try {
  const response = await apiCall();
  return response.data;
 } catch (error) {
  // Log the error with our error handling service
  errorHandlingService.handleApiError(error, context);
  throw error;
 }
}

/**
 * Helper function to make GET requests
 * @param url - API endpoint
 * @param params - Query parameters
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiGet<T>(
 url: string,
 params?: Record<string, any>,
 context?: Record<string, any>
): Promise<T> {
 return apiCall<T>(
  () => api.get(url, { params }),
  { ...context, method: 'GET', url }
 );
}

/**
 * Helper function to make POST requests
 * @param url - API endpoint
 * @param data - Request body
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiPost<T>(
 url: string,
 data?: any,
 context?: Record<string, any>
): Promise<T> {
 return apiCall<T>(
  () => api.post(url, data),
  { ...context, method: 'POST', url }
 );
}

/**
 * Helper function to make PATCH requests
 * @param url - API endpoint
 * @param data - Request body
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiPatch<T>(
 url: string,
 data?: any,
 context?: Record<string, any>
): Promise<T> {
 return apiCall<T>(
  () => api.patch(url, data),
  { ...context, method: 'PATCH', url }
 );
}

/**
 * Helper function to make DELETE requests
 * @param url - API endpoint
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiDelete<T>(
 url: string,
 context?: Record<string, any>
): Promise<T> {
 return apiCall<T>(
  () => api.delete(url),
  { ...context, method: 'DELETE', url }
 );
}

/**
 * Helper function to make PUT requests
 * @param url - API endpoint
 * @param data - Request body
 * @param context - Additional context for error handling
 * @returns Promise with the API response data
 */
export async function apiPut<T>(
 url: string,
 data?: any,
 context?: Record<string, any>
): Promise<T> {
 return apiCall<T>(
  () => api.put(url, data),
  { ...context, method: 'PUT', url }
 );
}

export default {
 get: apiGet,
 post: apiPost,
 patch: apiPatch,
 delete: apiDelete,
 put: apiPut,
 call: apiCall
};
