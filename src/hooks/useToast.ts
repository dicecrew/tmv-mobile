import { useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export const useToast = () => {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 3000,
  });

  const showToast = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string = '',
    duration: number = 3000
  ) => {
    setToastState({
      visible: true,
      type,
      title,
      message,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSuccess = useCallback((title: string, message: string = '', duration?: number) => {
    showToast('success', title, message, duration);
  }, [showToast]);

  const showError = useCallback((title: string, message: string = '', duration?: number) => {
    showToast('error', title, message, duration);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string = '', duration?: number) => {
    showToast('info', title, message, duration);
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string = '', duration?: number) => {
    showToast('warning', title, message, duration);
  }, [showToast]);

  return {
    toastState,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
