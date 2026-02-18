/**
 * Authentication Client
 * 
 * Better Auth client configuration for the frontend.
 * This client is used for authentication operations like sign-in, sign-out, etc.
 * 
 * @example
 * ```ts
 * import { authClient } from '#lib/auth/client';
 * 
 * // Sign in
 * await authClient.signIn.email({ email, password });
 * 
 * // Sign out
 * await authClient.signOut();
 * ```
 */

import { env } from '#config/env.ts';
import { betterAuth } from '#backend/modules/auth/authentication/instance.ts';
import { customSessionClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  basePath: '/auth',
  plugins: [customSessionClient<typeof betterAuth>()],
});