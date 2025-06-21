import { toast } from"react-hot-toast";
import { AxiosError } from"axios";

// Error types
export enum ErrorType {
 NETWORK ="network",
 AUTHENTICATION ="authentication",
 AUTHORIZATION ="authorization",
 VALIDATION ="validation",
 SERVER ="server",
 NOT_FOUND ="not_found",
 UNKNOWN ="unknown",
}

// Error severity levels
export enum ErrorSeverity {
 INFO ="info",
 WARNING ="warning",
 ERROR ="error",
 CRITICAL ="critical",
}

// Error interface
export interface AppError {
 type: ErrorType;
 message: string;
 severity: ErrorSeverity;
 originalError?: any;
 timestamp: Date;
 context?: Record<string, any>;
}

// Error handling service
class ErrorHandlingService {
 private errors: AppError[] = [];
 private errorListeners: ((error: AppError) => void)[] = [];

 // Add an error to the error log
 public logError(error: AppError): void {
  this.errors.push(error);
  this.notifyListeners(error);
  this.logToConsole(error);
 }

 // Handle API errors
 public handleApiError(error: any, context?: Record<string, any>): AppError {
  let appError: AppError;

  if (error.isAxiosError) {
   appError = this.handleAxiosError(error, context);
  } else {
   appError = {
    type: ErrorType.UNKNOWN,
    message: error.message ||"An unknown error occurred",
    severity: ErrorSeverity.ERROR,
    originalError: error,
    timestamp: new Date(),
    context,
   };
  }

  this.logError(appError);
  return appError;
 }

 // Handle Axios errors
 private handleAxiosError(
  error: AxiosError,
  context?: Record<string, any>
 ): AppError {
  const status = error.response?.status;
  let type = ErrorType.UNKNOWN;
  let severity = ErrorSeverity.ERROR;
  let message ="An unknown error occurred";

  // Determine error type and severity based on status code
  if (!error.response) {
   type = ErrorType.NETWORK;
   message ="Network error. Please check your connection.";
  } else if (status === 401) {
   type = ErrorType.AUTHENTICATION;
   message ="Authentication failed. Please log in again.";
  } else if (status === 403) {
   type = ErrorType.AUTHORIZATION;
   message ="You do not have permission to perform this action.";
  } else if (status === 404) {
   type = ErrorType.NOT_FOUND;
   message ="The requested resource was not found.";
   severity = ErrorSeverity.WARNING;
  } else if (status === 422 || status === 400) {
   type = ErrorType.VALIDATION;
   message ="Validation error. Please check your input.";
   severity = ErrorSeverity.WARNING;
  } else if (status && status >= 500) {
   type = ErrorType.SERVER;
   message ="Server error. Please try again later.";
   severity = ErrorSeverity.CRITICAL;
  }

  // Try to get more specific error message from the response
  if (error.response?.data) {
   const data = error.response.data as any;
   if (data.message) {
    message = Array.isArray(data.message)
     ? data.message.join(",")
     : data.message;
   } else if (data.error) {
    message = data.error;
   }
  }

  return {
   type,
   message,
   severity,
   originalError: error,
   timestamp: new Date(),
   context,
  };
 }

 // Show toast notification for error
 public showErrorToast(error: AppError): void {
  switch (error.severity) {
   case ErrorSeverity.INFO:
    toast.success(error.message);
    break;
   case ErrorSeverity.WARNING:
    // react-hot-toast doesn't have a warning method, so we use custom styling
    toast(error.message, {
     icon:"⚠️",
     style: {
      background:"#FEF3C7",
      color:"#92400E",
      border:"1px solid #F59E0B",
     },
    });
    break;
   case ErrorSeverity.ERROR:
   case ErrorSeverity.CRITICAL:
    toast.error(error.message);
    break;
  }
 }

 // Log error to console
 private logToConsole(error: AppError): void {
  const logMessage = `[${error.timestamp.toISOString()}] [${
   error.severity
  }] [${error.type}]: ${error.message}`;

  switch (error.severity) {
   case ErrorSeverity.INFO:
    console.info(logMessage, { error, context: error.context });
    break;
   case ErrorSeverity.WARNING:
    console.warn(logMessage, { error, context: error.context });
    break;
   case ErrorSeverity.ERROR:
   case ErrorSeverity.CRITICAL:
    console.error(logMessage, { error, context: error.context });
    break;
  }
 }

 // Add error listener
 public addErrorListener(listener: (error: AppError) => void): void {
  this.errorListeners.push(listener);
 }

 // Remove error listener
 public removeErrorListener(listener: (error: AppError) => void): void {
  this.errorListeners = this.errorListeners.filter((l) => l !== listener);
 }

 // Notify all listeners
 private notifyListeners(error: AppError): void {
  this.errorListeners.forEach((listener) => listener(error));
 }

 // Get all errors
 public getErrors(): AppError[] {
  return [...this.errors];
 }

 // Clear all errors
 public clearErrors(): void {
  this.errors = [];
 }
}

export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;
