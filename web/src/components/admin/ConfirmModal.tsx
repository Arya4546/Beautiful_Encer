import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  loading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-600 bg-red-100',
      button: 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-medium focus:ring-red-500',
    },
    warning: {
      icon: 'text-yellow-600 bg-yellow-100',
      button: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-medium focus:ring-yellow-500',
    },
    info: {
      icon: 'text-magenta bg-magenta/10',
      button: 'bg-gradient-to-r from-magenta to-pink-500 hover:shadow-medium focus:ring-magenta',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-large max-w-md w-full transform transition-all border border-border">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${styles.icon} flex items-center justify-center mb-4`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-text-secondary mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-text-secondary font-medium hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText || t('common.cancel')}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  confirmText || t('common.confirm')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
