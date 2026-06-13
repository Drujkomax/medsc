import { supabase } from '@/integrations/supabase/client';

// Hard caps to prevent runaway error storms from DDoS-ing our own database.
// These existed before as bug: every <img onError> fired a Supabase RPC,
// producing ~30-70k inserts/day to system_logs/system_alerts.
const MAX_LOGS_PER_SESSION = 50;
const DEDUPE_WINDOW_MS = 60_000;
const FINGERPRINT_CACHE_LIMIT = 200;

let logsSentThisSession = 0;
const recentFingerprints = new Map<string, number>();

const isExtensionUrl = (u?: string | null): boolean => {
  if (!u) return false;
  return (
    u.startsWith('chrome-extension://') ||
    u.startsWith('moz-extension://') ||
    u.startsWith('safari-extension://') ||
    u.startsWith('webkit-masked-url://')
  );
};

// Глобальный обработчик необработанных ошибок
export const setupGlobalErrorHandling = () => {
  // Обработчик для необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    logGlobalError('unhandled_promise', error, {
      promise: true,
      prevented: event.defaultPrevented,
    });

    console.error('Unhandled promise rejection:', error);
  });

  // Обработчик для JavaScript ошибок (bubble phase — не ловит resource errors)
  window.addEventListener('error', (event) => {
    // Resource errors не всплывают; они ловятся capture-phase listener-ом ниже
    if (event.target && event.target !== window) return;
    if (isExtensionUrl(event.filename)) return;

    logGlobalError('javascript_error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      message: event.message,
    });

    console.error('Global JavaScript error:', event.error);
  });

  // Resource errors (img/script/link load failures) НЕ отправляем в БД.
  // Они отлично видны во вкладке Network и не имеют смысла в системных логах —
  // именно они привели к 2.8М мусорных записей.
  window.addEventListener(
    'error',
    (event) => {
      if (!event.target || event.target === window) return;
      const target = event.target as Element & { src?: string; href?: string };
      const url = target.src || target.href;
      console.warn(`Failed to load resource (${target.tagName}): ${url}`);
    },
    true,
  );
};

// Функция для логирования глобальных ошибок
const logGlobalError = async (
  errorType: string,
  error: unknown,
  additionalDetails: Record<string, unknown> = {},
) => {
  if (logsSentThisSession >= MAX_LOGS_PER_SESSION) return;

  const errorObj = error instanceof Error ? error : new Error(String(error));

  const fingerprint = `${errorType}|${errorObj.message}|${
    (additionalDetails.filename as string) ?? ''
  }|${(additionalDetails.lineno as number) ?? ''}`;

  const now = Date.now();
  const lastSent = recentFingerprints.get(fingerprint);
  if (lastSent !== undefined && now - lastSent < DEDUPE_WINDOW_MS) return;

  recentFingerprints.set(fingerprint, now);
  if (recentFingerprints.size > FINGERPRINT_CACHE_LIMIT) {
    const oldestKey = recentFingerprints.keys().next().value;
    if (oldestKey !== undefined) recentFingerprints.delete(oldestKey);
  }

  logsSentThisSession += 1;

  try {
    await supabase.rpc('log_system_event', {
      p_level: 'error',
      p_category: 'ui',
      p_message: `Global ${errorType}: ${errorObj.message}`,
      p_details: {
        errorType,
        error: {
          name: errorObj.name,
          message: errorObj.message,
          stack: errorObj.stack,
        },
        ...additionalDetails,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      p_stack_trace: errorObj.stack,
    });
  } catch (logError) {
    console.error('Failed to log global error:', logError);
    console.error('Original error:', error);
  }
};

// Функция для ручного логирования критических событий
export const logCriticalEvent = async (
  message: string,
  category: 'security' | 'business' | 'performance' | 'auth' = 'business',
  details: Record<string, unknown> = {},
) => {
  try {
    await supabase.rpc('log_system_event', {
      p_level: 'error',
      p_category: category,
      p_message: message,
      p_details: {
        ...details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    });
  } catch (error) {
    console.error('Failed to log critical event:', error);
  }
};

// Функция для логирования безопасности
export const logSecurityEvent = async (
  event: string,
  details: Record<string, unknown> = {},
) => {
  return logCriticalEvent(`Security Event: ${event}`, 'security', details);
};

// Функция для логирования производительности
export const logPerformanceIssue = async (
  operation: string,
  duration: number,
  details: Record<string, unknown> = {},
) => {
  if (duration > 3000) {
    return logCriticalEvent(
      `Performance Issue: ${operation} took ${duration}ms`,
      'performance',
      { duration, operation, ...details },
    );
  }
};
