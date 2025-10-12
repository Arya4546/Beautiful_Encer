/**
 * Error Page Component
 * Handles 404, 500, and other error states
 */

import React from 'react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code,
  title,
  message,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();
  const error = useRouteError();

  // Determine error details from router error if available
  let errorCode = code || 500;
  let errorTitle = title || 'Something went wrong';
  let errorMessage = message || 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    errorCode = error.status;
    errorTitle = error.statusText;
    errorMessage = error.data?.message || error.data || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Specific error messages
  if (errorCode === 404) {
    errorTitle = 'Page Not Found';
    errorMessage = 'The page you are looking for does not exist or has been moved.';
  } else if (errorCode === 403) {
    errorTitle = 'Access Denied';
    errorMessage = 'You do not have permission to access this page.';
  } else if (errorCode === 500) {
    errorTitle = 'Server Error';
    errorMessage = 'Our servers encountered an error. Please try again later.';
  }

  const handleGoHome = () => {
    navigate('/discover');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-white to-magenta/5 p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-large border border-border p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>

          {/* Error Code */}
          {errorCode && (
            <div className="text-6xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-4">
              {errorCode}
            </div>
          )}

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-text-primary mb-3">
            {errorTitle}
          </h1>

          {/* Error Message */}
          <p className="text-text-secondary mb-8 leading-relaxed">
            {errorMessage}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showHomeButton && (
              <button
                onClick={handleGoHome}
                className="w-full px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Go to Home
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="px-4 py-3 border border-border rounded-xl font-medium hover:bg-background-secondary transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>

              <button
                onClick={handleRefresh}
                className="px-4 py-3 border border-border rounded-xl font-medium hover:bg-background-secondary transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-text-tertiary mt-6">
          If the problem persists, please{' '}
          <a
            href="mailto:support@beautifulencer.com"
            className="text-magenta hover:text-magenta-dark font-medium"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
};

// 404 Not Found Component
export const NotFoundPage: React.FC = () => (
  <ErrorPage code={404} />
);

// 500 Server Error Component
export const ServerErrorPage: React.FC = () => (
  <ErrorPage code={500} />
);

// 403 Forbidden Component
export const ForbiddenPage: React.FC = () => (
  <ErrorPage code={403} />
);
