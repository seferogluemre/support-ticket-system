import { Elysia } from 'elysia';
import authenticationController from './authentication/controller';
import authorizationController from './authorization/controller';

/**
 * Auth module - authentication ve authorization
 */
const app = new Elysia().use(authenticationController).use(authorizationController);

export default app;
