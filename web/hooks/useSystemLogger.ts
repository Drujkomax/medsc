import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogCategory = 'auth' | 'api' | 'business' | 'performance' | 'security' | 'ui';

interface LogEvent {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
  url?: string;
  stackTrace?: string;
}

export const useSystemLogger = () => {
  const logEvent = useCallback(async (event: LogEvent) => {
    try {
      // Получаем информацию о браузере и URL
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : undefined;
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      
      // Логируем в базу данных
      const { error } = await supabase.rpc('log_system_event', {
        p_level: event.level,
        p_category: event.category,
        p_message: event.message,
        p_details: event.details || {},
        p_user_agent: userAgent,
        p_url: event.url || currentUrl,
        p_stack_trace: event.stackTrace
      });

      if (error) {
        console.error('Failed to log system event:', error);
      }

      // Дублируем в консоль для разработки
      if (process.env.NODE_ENV === 'development') {
        const logMethod = event.level === 'error' ? console.error : 
                         event.level === 'warn' ? console.warn : console.log;
        logMethod(`[${event.category.toUpperCase()}] ${event.message}`, event.details);
      }
    } catch (error) {
      console.error('System logger error:', error);
    }
  }, []);

  // Специализированные методы логирования
  const logError = useCallback((category: LogCategory, message: string, error?: Error, details?: Record<string, any>) => {
    logEvent({
      level: 'error',
      category,
      message,
      details: {
        ...details,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      stackTrace: error?.stack
    });
  }, [logEvent]);

  const logWarning = useCallback((category: LogCategory, message: string, details?: Record<string, any>) => {
    logEvent({
      level: 'warn',
      category,
      message,
      details
    });
  }, [logEvent]);

  const logInfo = useCallback((category: LogCategory, message: string, details?: Record<string, any>) => {
    logEvent({
      level: 'info',
      category,
      message,
      details
    });
  }, [logEvent]);

  const logPerformance = useCallback((operation: string, duration: number, details?: Record<string, any>) => {
    logEvent({
      level: duration > 2000 ? 'warn' : 'info',
      category: 'performance',
      message: `${operation} completed in ${duration}ms`,
      details: {
        ...details,
        duration,
        operation
      }
    });
  }, [logEvent]);

  const logBusinessEvent = useCallback((event: string, details?: Record<string, any>) => {
    logEvent({
      level: 'info',
      category: 'business',
      message: event,
      details
    });
  }, [logEvent]);

  const logSecurityEvent = useCallback((event: string, details?: Record<string, any>) => {
    logEvent({
      level: 'warn',
      category: 'security',
      message: event,
      details
    });
  }, [logEvent]);

  return {
    logEvent,
    logError,
    logWarning,
    logInfo,
    logPerformance,
    logBusinessEvent,
    logSecurityEvent
  };
};