import { Component, type ErrorInfo, type ReactNode } from 'react';
import errorHandlingService, { ErrorType, ErrorSeverity } from '../../services/errorHandling';

interface Props {
 children: ReactNode;
 fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
 onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
  super(props);
  this.state = {
   hasError: false,
   error: null,
  };
 }

 static getDerivedStateFromError(error: Error): State {
  return {
   hasError: true,
   error,
  };
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  // Log the error to our error handling service
  errorHandlingService.logError({
   type: ErrorType.UNKNOWN,
   message: error.message,
   severity: ErrorSeverity.ERROR,
   originalError: error,
   timestamp: new Date(),
   context: { componentStack: errorInfo.componentStack },
  });

  // Call the onError callback if provided
  if (this.props.onError) {
   this.props.onError(error, errorInfo);
  }
 }

 resetError = (): void => {
  this.setState({
   hasError: false,
   error: null,
  });
 };

 render(): ReactNode {
  const { hasError, error } = this.state;
  const { children, fallback } = this.props;

  if (hasError && error) {
   if (fallback) {
    if (typeof fallback === 'function') {
     return fallback(error, this.resetError);
    }
    return fallback;
   }

   // Default fallback UI
   return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
     <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
     <p className="mt-2 text-sm text-red-700">{error.message}</p>
     <button
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      onClick={this.resetError}
     >
      Try again
     </button>
    </div>
   );
  }

  return children;
 }
}

export default ErrorBoundary;
