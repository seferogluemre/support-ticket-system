import { Elysia } from 'elysia';
import organizationsController from './organizations/controller';
import permissionsController from './permissions/controller';
import rolesController from './roles/controller';
import userPermissionsController from './user-permissions/controller';

/**
 * Authorization module - tüm yetki yönetimi endpoint'leri
 */
const authorizationController = new Elysia({
  prefix: '/auth',
})
  .use(rolesController)
  .use(permissionsController)
  .use(userPermissionsController)
  .use(organizationsController);

export default authorizationController;

