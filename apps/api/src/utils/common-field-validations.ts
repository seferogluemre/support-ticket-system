import { t } from 'elysia';

const uuid = t.String({
  format: 'uuid',
});

const ip = t.String({
  pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
  error: 'Geçersiz IP adresi formatı',
});

/**
 * UUID v4 regex pattern
 * Matches: 123e4567-e89b-12d3-a456-426614174000
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID v4
 * @param value String to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export { ip as ipValidation, uuid as uuidValidation };
