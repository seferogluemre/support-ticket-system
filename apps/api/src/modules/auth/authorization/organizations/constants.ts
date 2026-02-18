import { t } from 'elysia';
import { OrganizationType } from '@onlyjs/db/enums';

export const OrganizationTypeSchema = t.Union(Object.entries(OrganizationType).map(([key, value]) => t.Literal(value)));
