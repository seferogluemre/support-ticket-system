import { t } from 'elysia';
import { type ControllerHook, errorResponseDto } from '../../utils';

export const resetDatabaseDto = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      timestamp: t.String(),
    }),
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Reset Database',
    description: 'Completely resets the database using prisma migrate reset command',
  },
} satisfies ControllerHook;
