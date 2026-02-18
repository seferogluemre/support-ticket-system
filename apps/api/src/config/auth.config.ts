/**
 * Auth Bypass Configuration
 *
 * ⚠️ TEMPORARY: Development aşamasında authorization kontrollerini bypass eder.
 * Production'da ASLA aktif olmamalıdır.
 */
export const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS_ENABLED === 'true';

// Startup warning
if (AUTH_BYPASS_ENABLED) {
  console.warn('⚠️  AUTH BYPASS IS ENABLED - All authorization checks are disabled');
}
