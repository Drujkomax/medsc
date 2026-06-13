// Secure logging utility that only logs in development
// and sends critical errors to system logs

import { supabase } from '@/integrations/supabase/client';

const isDevelopment = import.meta.env.DEV;

interface LogOptions {
  category?: string;
  level?: 'info' | 'warn' | 'error';
  details?: Record<string, any>;
}

/**
 * Secure logger that:
 * - Only logs to console in development
 * - Sends errors to server-side system logs
 * - Sanitizes sensitive data before logging
 */
export const secureLog = {
  /**
   * Log informational messages (development only)
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  /**
   * Log errors - sends to server in production, console in development
   */
  error: async (error: Error | string, options?: LogOptions) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    // Always log to server for audit trail
    try {
      await supabase.rpc('log_system_event', {
        p_level: 'error',
        p_category: options?.category || 'client',
        p_message: errorMessage,
        p_details: {
          ...options?.details,
          userAgent: navigator.userAgent,
          url: window.location.href
        },
        p_stack_trace: stackTrace
      });
    } catch (e) {
      // Fallback if logging fails - only show in dev
      if (isDevelopment) {
        console.error('Failed to log error to server:', e);
      }
    }

    // Show in console only in development
    if (isDevelopment) {
      if (error instanceof Error) {
        console.error(error);
      } else {
        console.error(errorMessage);
      }
    }
  },

  /**
   * Log authentication events to server
   */
  auth: async (message: string, details?: Record<string, any>) => {
    try {
      await supabase.rpc('log_system_event', {
        p_level: 'info',
        p_category: 'auth',
        p_message: message,
        p_details: details || {}
      });
    } catch (e) {
      if (isDevelopment) {
        console.error('Failed to log auth event:', e);
      }
    }

    if (isDevelopment) {
      console.log(`[AUTH] ${message}`, details);
    }
  },

  /**
   * Log security events (always sent to server)
   */
  security: async (message: string, details?: Record<string, any>) => {
    try {
      await supabase.rpc('log_system_event', {
        p_level: 'warn',
        p_category: 'security',
        p_message: message,
        p_details: details || {}
      });
    } catch (e) {
      if (isDevelopment) {
        console.error('Failed to log security event:', e);
      }
    }

    if (isDevelopment) {
      console.warn(`[SECURITY] ${message}`, details);
    }
  }
};

/**
 * Sanitize data before logging - removes sensitive fields
 */
export const sanitizeForLog = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sensitive = ['password', 'token', 'apiKey', 'secret', 'credential'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
};
