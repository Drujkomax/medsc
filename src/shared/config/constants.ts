/**
 * Public configuration constants
 * These values are safe to expose in the client bundle
 * All sensitive secrets MUST be stored in Supabase Edge Function Secrets
 */

export const PUBLIC_CONFIG = {
  // Supabase Edge Functions base URL
  EDGE_BASE_URL: 'https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1',
  
  // Telegram bot configuration (public info only)
  TELEGRAM_BOT_USERNAME: '@medsc_bot',
  
  // Support contact
  SUPPORT_EMAIL: 'support@medsc.uz',
  
  // Application metadata
  APP_NAME: 'Med Service Centre',
  APP_VERSION: '1.0.0',
} as const;

/**
 * Validates that all required client-side configuration is present
 * Throws an error if any critical config is missing
 */
export function validateClientConfig() {
  const requiredFields: (keyof typeof PUBLIC_CONFIG)[] = [
    'EDGE_BASE_URL',
    'TELEGRAM_BOT_USERNAME',
    'SUPPORT_EMAIL',
  ];

  const missing = requiredFields.filter(field => !PUBLIC_CONFIG[field]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required client configuration: ${missing.join(', ')}`
    );
  }

  return PUBLIC_CONFIG;
}

/**
 * Helper to construct full Edge Function URLs
 */
export function getEdgeFunctionUrl(functionName: string): string {
  return `${PUBLIC_CONFIG.EDGE_BASE_URL}/${functionName}`;
}
