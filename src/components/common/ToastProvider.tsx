import React, { createContext, useContext, ReactNode } from 'react';
import CustomToast from './CustomToast';
import { useToast } from '../../hooks/useToast';

interface ToastContextType {
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toastState, showToast, hideToast, showSuccess, showError, showInfo, showWarning } = useToast();

  const contextValue: ToastContextType = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <CustomToast
        visible={toastState.visible}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        duration={toastState.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
