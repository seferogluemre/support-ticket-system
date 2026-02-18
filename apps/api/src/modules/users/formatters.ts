import { BaseFormatter } from '#utils/base-formatter';
import type { User } from '@onlyjs/db/client';
import type { OrganizationType } from '@onlyjs/db/enums';
import { userResponseSchema } from './dtos';
import type { UserShowResponse } from './types';

export abstract class UserFormatter {
  static response(
    data: User & {
      userRoles?: Array<{
        role: {
          uuid: string;
          name: string;
          type: string;
          organizationType: OrganizationType | null;
          organizationUuid: string | null;
        };
      }>;
    },
  ) {
    // Format roles if present
    const formattedData = {
      ...data,
      roles:
        data.userRoles?.map((ur) => ({
          uuid: ur.role.uuid,
          name: ur.role.name,
          type: ur.role.type,
          organizationType: ur.role.organizationType,
          organizationUuid: ur.role.organizationUuid,
        })) || [],
    };

    const convertedData = BaseFormatter.convertData<UserShowResponse>(
      formattedData,
      userResponseSchema,
    );

    return convertedData;
  }
}
