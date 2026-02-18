import {
  type ControllerHook,
  dtoWithMiddlewares,
  ForbiddenException,
  isValidUuid,
} from '../../../utils';
import { AUTH_BYPASS_ENABLED } from '../../../config/auth.config';
import type { AuthContext } from '../authentication/types';
import { generateUserClaims } from './claims';
import { OrganizationType } from '@onlyjs/db/enums';
import { validateUserAccessToOrganization } from './organizations/helpers';
import { isPermissionGrantedToUser } from './permissions/checks';
import type { PermissionIdentifier } from './permissions/types';

/**
 * Permission kontrolü yapar
 * - Önce global izni kontrol eder
 * - Global izin yoksa ve organizationUuid verilmişse, organization-specific izni kontrol eder
 *
 * 🔒 SECURITY: organizationUuid verildiğinde, kullanıcının o organization'a erişim yetkisi olup olmadığını kontrol eder
 *
 * @param permission Kontrol edilecek permission
 * @param organizationUuidGetter Context'ten organization UUID'yi alan fonksiyon (opsiyonel)
 * @param organizationType Organization türü (default: OrganizationType.COMPANY)
 *
 * @example
 * ```ts
 * // Sadece global permission kontrolü
 * app.get('/admin', handler, withPermission(PERMISSIONS.ADMIN.ACCESS))
 *
 * // Global VEYA organization-specific permission kontrolü (UUID kullanımı)
 * app.get('/organizations/:uuid', handler,
 *   withPermission(
 *     PERMISSIONS.COMPANIES.SHOW,
 *     (ctx) => ctx.params.uuid, // UUID kullan, ID değil!
 *     OrganizationType.COMPANY
 *   )
 * )
 * ```
 */
export function withPermission(
  permission?: PermissionIdentifier,
  organizationUuidGetter?: (ctx: AuthContext) => string | undefined,
  organizationType: OrganizationType = OrganizationType.COMPANY,
) {
  return {
    beforeHandle: async (ctx: AuthContext) => {
      if (!permission) return;

      // Auth bypass aktifse permission kontrolünü atla
      if (AUTH_BYPASS_ENABLED) {
        return;
      }

      const organizationUuid = organizationUuidGetter?.(ctx);

      // 🔒 SECURITY: Organization UUID varsa, kullanıcının bu organization'a erişimi var mı kontrol et
      // EXCEPTION: "ALL_ORGANIZATIONS" yetkisi varsa bu kontrolü atla (cross-org access için)
      if (organizationUuid) {
        // UUID format validation
        if (!isValidUuid(organizationUuid)) {
          throw new ForbiddenException(`Geçersiz Organization UUID formatı: ${organizationUuid}`);
        }
        const claims = await generateUserClaims(ctx.user.id);

        // Global wildcard veya cross-organization yetkisi varsa, membership kontrolü yapma
        const hasCrossOrgAccess =
          claims.global.includes('*') || claims.global.some((p) => p.includes('all-organizations'));

        if (!hasCrossOrgAccess) {
          const hasAccess = await validateUserAccessToOrganization(
            ctx.user.id,
            organizationUuid,
            organizationType,
          );

          if (!hasAccess) {
            throw new ForbiddenException("Bu organization'a erişim yetkiniz yok");
          }
        }
      }

      // Permission kontrolü
      const userHasPermission = await isPermissionGrantedToUser(
        ctx.user,
        permission,
        organizationUuid,
        organizationType,
      );

      if (!userHasPermission) {
        throw new ForbiddenException('Bu işlem için yetkiniz yok');
      }
    },
  };
}

/**
 * DTO wrapper with permission check
 * Supports both global and organization-specific permissions
 *
 * @example
 * ```ts
 * // Global permission check
 * dtoWithPermission(myDto, PERMISSIONS.ADMIN.ACCESS)
 *
 * // Organization-specific permission check (UUID kullanımı)
 * dtoWithPermission(
 *   myDto,
 *   PERMISSIONS.COMPANIES.SHOW,
 *   (ctx) => ctx.params.organizationUuid, // UUID kullan, ID değil!
 *   OrganizationType.COMPANY
 * )
 * ```
 */
export function dtoWithPermission<T extends ControllerHook>(
  hook: T,
  permission?: PermissionIdentifier,
  organizationUuidGetter?: (ctx: AuthContext) => string | undefined,
  organizationType: OrganizationType = OrganizationType.COMPANY,
): T {
  return dtoWithMiddlewares(
    hook,
    withPermission(permission, organizationUuidGetter, organizationType),
  );
}
