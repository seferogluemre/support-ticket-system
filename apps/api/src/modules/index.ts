import Elysia from 'elysia';
import authController from './auth/controller';
import { fileLibraryAssetsController } from './file-library-assets';
import { locationsController } from './locations';
import { postsController } from './posts';
import { systemAdministrationController } from './system-administration';
import { usersController } from './users';
import { companiesController } from './companies';
import projectsController from './projects';
import { ticketsController } from './tickets';

const app = new Elysia()
  .use(systemAdministrationController)
  .use(usersController)
  .use(authController)
  .use(postsController)
  .use(projectsController)
  .use(ticketsController)
  .use(locationsController)
  .use(companiesController)
  .use(fileLibraryAssetsController)
  .get(
    '/',
    () => ({
      message: 'Hello World',
    }),
    {
      detail: {
        summary: 'Hello World',
      },
    },
  );

export const swaggerTags: { name: string; description: string }[] = [
  {
    name: 'System Administration',
    description: 'System Administration endpoints',
  },
  { name: 'Audit Logs', description: 'Audit Logs endpoints' },
  { name: 'User', description: 'User endpoints' },
  { name: 'Auth', description: 'Auth endpoints' },
  { name: 'Role', description: 'Role endpoints' },
  { name: 'Post', description: 'Post endpoints' },
  { name: 'Projects', description: 'Project management endpoints - demonstrates different permission levels (System Admin, Company Admin, Company Member)' },
  { name: 'Ticket', description: 'Support ticket management endpoints - Zendesk-like ticket system with company-scoped permissions' },
  { name: 'Country', description: 'Country endpoints' },
  { name: 'State', description: 'State endpoints' },
  { name: 'City', description: 'City endpoints' },
  { name: 'Region', description: 'Region endpoints' },
  { name: 'Subregion', description: 'Subregion endpoints' },
  { name: 'File Library Assets', description: 'File Library Assets endpoints' },
];

export default app;
