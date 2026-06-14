import { useCallback } from 'react';
import { useSystemLogger } from './useSystemLogger';
import { toast } from 'sonner';

export const useErrorHandler = () => {
  const { logError, logWarning } = useSystemLogger();

  const handleError = useCallback((error: Error, context?: string, showToast = true) => {
    // Логируем ошибку
    logError('api', `${context ? `${context}: ` : ''}${error.message}`, error, {
      context,
      timestamp: new Date().toISOString()
    });

    // Показываем уведомление пользователю
    if (showToast) {
      toast.error(context || 'Произошла ошибка', {
        description: error.message
      });
    }

    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  }, [logError]);

  const handleApiError = useCallback((error: any, operation: string) => {
    const errorMessage = error?.message || error?.error_description || 'Неизвестная ошибка API';
    
    logError('api', `API Error in ${operation}: ${errorMessage}`, new Error(errorMessage), {
      operation,
      statusCode: error?.status,
      details: error
    });

    toast.error(`Ошибка при ${operation}`, {
      description: errorMessage
    });
  }, [logError]);

  const handleBusinessError = useCallback((message: string, details?: Record<string, any>) => {
    logWarning('business', message, details);
    
    toast.warning('Внимание', {
      description: message
    });
  }, [logWarning]);

  const handleAuthError = useCallback((error: any) => {
    const errorMessage = error?.message || 'Ошибка аутентификации';
    
    logError('auth', `Authentication error: ${errorMessage}`, error, {
      errorCode: error?.error_code,
      details: error
    });

    toast.error('Ошибка входа', {
      description: errorMessage
    });
  }, [logError]);

  return {
    handleError,
    handleApiError,
    handleBusinessError,
    handleAuthError
  };
};