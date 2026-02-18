import { Elysia } from 'elysia';
import { auth } from '../../authentication/plugin';
import { clearWildcardCache } from '../claims/service';
import { PERMISSIONS } from './constants';
import { permissionGroupsDto, permissionIndexDto } from './dtos';
import { PermissionsService } from './service';

const app = new Elysia({
  prefix: '/permissions',
  detail: {
    tags: ['Permissions'],
  },
}).guard(
  {
    detail: {
      security: [{ cookie: [] }],
    },
  },
  (app) =>
    app
      // Permission listeleri herkes görebilir (UI için gerekli)
      // Asıl güvenlik role create/update sırasında kontrol edilir
      .use(auth())
      .get(
        '',
        async ({ query }) => {
          const permissions = await PermissionsService.index(query.organizationType);
          return permissions;
        },
        permissionIndexDto,
      )
      .get(
        '/groups',
        async ({ query }) => {
          const groups = await PermissionsService.getGroups(query.organizationType);
          return groups;
        },
        permissionGroupsDto,
      )
      // Admin-only: Clear wildcard cache
      .use(auth(PERMISSIONS.SYSTEM_ADMINISTRATION.RESET_DATABASE))
      .post(
        '/cache/clear',
        async () => {
          clearWildcardCache();
          return {
            success: true,
            message: 'Wildcard expansion cache cleared successfully',
            timestamp: new Date().toISOString(),
          };
        },
        {
          detail: {
            summary: 'Clear permission cache',
            description: 'Clears the wildcard expansion cache. Rarely needed as permissions are static.',
            tags: ['Permissions', 'Admin'],
          },
        },
      ),
);

export default app;
