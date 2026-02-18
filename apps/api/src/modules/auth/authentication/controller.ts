import { MethodNotAllowedException } from '#utils/http-errors.ts';
import type { OrganizationType } from '@onlyjs/db/enums';
import { type Context, Elysia } from 'elysia';
import { UserFormatter } from '../../users';
import { OrganizationsService } from '../authorization/organizations/service';
import { authMeDto } from './dtos';
import { betterAuth } from './instance';
import { auth, authSwagger } from './plugin';

const app = new Elysia({
  prefix: '/auth',
  detail: {
    tags: ['Authentication'],
  },
})
  .guard(authSwagger, (app) =>
    app.use(auth()).get(
      '/me',
      async ({ user }) => {
        // Get user's claims (permissions)
        const claims = user.claims as {
          global: string[];
          organizations: Record<string, Record<string, string[]>>;
        } | null;

        // Get user's all roles (minimal info) from better-auth
        const allRoles =
          (user.roles as Array<{
            uuid: string;
            organizationType?: OrganizationType;
            organizationUuid?: string;
          }>) || [];

        // Separate global roles from organization roles
        const globalRoles = allRoles.filter(
          (role) => !role.organizationType && !role.organizationUuid,
        );

        // Get all organization memberships (includes organization-specific roles)
        const organizationMemberships = await OrganizationsService.getCurrentUserMemberships(
          user.id,
        );

        // Standard user response with permissions and roles
        const userResponse = UserFormatter.response(user);
        return {
          ...userResponse,
          // Claims: structured permissions by scope
          claims: {
            global: claims?.global ?? [],
            organizations: claims?.organizations ?? {},
          },
          // Global roles (no organization context)
          globalRoles: globalRoles.map((role) => ({ uuid: role.uuid })),
          // Organization memberships (includes organization-specific roles per organization)
          organizationMemberships,
        };
      },
      authMeDto,
    ),
  )
  // Handle better-auth requests
  .all('*', async (context: Context) => {
    const BETTER_AUTH_ACCEPT_METHODS = ['POST', 'GET'];
    // validate request method
    if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
      const response = await betterAuth.handler(context.request);

      if (!response.ok) {
        if (!response.headers.get('Content-Type')) {
          response.headers.set('Content-Type', 'application/json');
        }
      }

      // Dynamically set cookie domain and SameSite based on request origin
      const origin = context.request.headers.get('origin');
      if (origin) {
        try {
          const originUrl = new URL(origin);
          const hostname = originUrl.hostname;
          
          // Validate origin against trustedOrigins
          const trustedOrigins = [
            process.env.APP_URL!,
            process.env.API_URL!,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
          ];
          
          const isTrustedOrigin = trustedOrigins.some(trusted => {
            try {
              const trustedUrl = new URL(trusted);
              return trustedUrl.origin === originUrl.origin;
            } catch {
              return false;
            }
          });
          
          if (!isTrustedOrigin) {
            // Origin not trusted, don't modify cookies
            return response;
          }
          
          // Determine if this is a localhost/development request
          const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
          
          // Extract domain for cookie
          let cookieDomain: string;
          
          if (isLocalhost) {
            // For localhost, don't set domain (browser will use exact hostname)
            cookieDomain = '';
          } else {
            // For production domains, extract base domain
            const parts = hostname.split('.');
            if (parts.length >= 2) {
              cookieDomain = parts.slice(-2).join('.');
            } else {
              cookieDomain = hostname;
            }
          }

          // Modify Set-Cookie headers to use dynamic domain and SameSite
          const setCookieHeaders = response.headers.getSetCookie();
          if (setCookieHeaders.length > 0) {
            // Remove existing Set-Cookie headers
            response.headers.delete('Set-Cookie');
            
            // Re-add with modified domain and SameSite
            for (const cookie of setCookieHeaders) {
              let modifiedCookie = cookie;
              
              // Handle Domain attribute
              if (cookieDomain) {
                // Replace existing Domain attribute or add it
                if (cookie.includes('Domain=')) {
                  modifiedCookie = cookie.replace(/Domain=[^;]+/, `Domain=${cookieDomain}`);
                } else {
                  // Add Domain before Path if exists, otherwise at the end
                  if (cookie.includes('Path=')) {
                    modifiedCookie = cookie.replace(/Path=/, `Domain=${cookieDomain}; Path=`);
                  } else {
                    modifiedCookie = `${cookie}; Domain=${cookieDomain}`;
                  }
                }
              } else {
                // Remove Domain attribute for localhost
                modifiedCookie = cookie.replace(/;\s*Domain=[^;]+/g, '');
              }
              
              // Handle SameSite and Secure attributes for localhost
              if (isLocalhost) {
                // For localhost development over HTTP:
                // - Remove Secure flag (required for HTTP)
                // - Use SameSite=Lax instead of None (None requires Secure)
                // This is safe because we validate the origin against trustedOrigins
                
                // Remove Secure flag for localhost HTTP
                modifiedCookie = modifiedCookie.replace(/;\s*Secure/gi, '');
                
                // Keep or set SameSite=Lax for localhost
                if (cookie.includes('SameSite=')) {
                  modifiedCookie = modifiedCookie.replace(/SameSite=[^;]+/, 'SameSite=Lax');
                } else {
                  modifiedCookie = `${modifiedCookie}; SameSite=Lax`;
                }
              }
              // For production, keep SameSite=Lax and Secure (default from better-auth)
              
              response.headers.append('Set-Cookie', modifiedCookie);
            }
          }
        } catch (error) {
          // If origin parsing fails, keep original response
          console.error('Failed to parse origin for dynamic cookie domain:', error);
        }
      }

      return response;
    } else {
      throw new MethodNotAllowedException();
    }
  });

export default app;
