import { dtoWithMiddlewares } from '#utils';
import prisma from '@onlyjs/db';
import { FileLibraryAssetType } from '@onlyjs/db/enums';
import { Elysia } from 'elysia';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../../../audit-logs';
import { FileLibraryAssetsService } from '../../../file-library-assets/service';
import { auth, authSwagger } from '../../authentication/plugin';
import { OrganizationType } from '@onlyjs/db/enums';
import {
  membersDestroyDto,
  companyMemberAvatarUpdateDto,
  companyMembersIndexDto,
  companyMembersShowDto,
  companyMembersStoreDto,
  companyMembersUpdateDto,
} from './dtos';
import { OrganizationsService } from './service';
import type { CompanyMember, CompanyMemberDetails } from './types/company.types';

const app = new Elysia({
  prefix: '/organizations',
  detail: {
    tags: ['Organizations'],
  },
}).guard(authSwagger, (app) =>
  app
    .use(auth())
    /**
     * Company organization endpoints
     * /organizations/company/...
     */
    .group('/company', (app) =>
      app
        /**
         * GET /organizations/company/:organizationUuid/members
         * List all members of a company
         */
        .get(
          '/:organizationUuid/members',
          async ({ params }) => {
            const members = await OrganizationsService.getMembers<CompanyMember>(
              OrganizationType.COMPANY,
              params.organizationUuid,
            );
            return members;
          },
          companyMembersIndexDto,
        )
        /**
         * GET /organizations/company/:organizationUuid/members/:userId
         * Get detailed information about a specific company member
         */
        .get(
          '/:organizationUuid/members/:userId',
          async ({ params }) => {
            const member = await OrganizationsService.getMember<CompanyMemberDetails>(
              OrganizationType.COMPANY,
              params.organizationUuid,
              params.userId,
            );
            return member;
          },
          companyMembersShowDto,
        )
        /**
         * POST /organizations/company/:organizationUuid/members
         * Add a member to a company
         */
        .post(
          '/:organizationUuid/members',
          async ({ params, body, user }) => {
            const result = await OrganizationsService.addMember(
              OrganizationType.COMPANY,
              params.organizationUuid,
              {
                userId: body.userId,
                createUser: body.createUser,
              },
              user!,
              body.roleUuids,
            );

            return {
              success: true,
              ...result,
            };
          },
          dtoWithMiddlewares(
            companyMembersStoreDto,
            withAuditLog({
              actionType: AuditLogAction.CREATE,
              entityType: AuditLogEntity.USER,
              getEntityUuid: (ctx) => {
                // @ts-ignore
                const response = ctx.response as { userId: string };
                return response.userId;
              },
              getDescription: () => 'Kullanıcı company organizasyonuna üye eklendi',
            }),
          ),
        )
        /**
         * PUT /organizations/company/:organizationUuid/members/:userId
         * Update a company member (roles)
         */
        .put(
          '/:organizationUuid/members/:userId',
          async ({ params, body, user }) => {
            await OrganizationsService.updateMember(
              OrganizationType.COMPANY,
              params.organizationUuid,
              params.userId,
              user!,
              body.roleUuids,
              {
                firstName: body.user?.firstName,
                lastName: body.user?.lastName,
                email: body.user?.email,
                gender: body.user?.gender,
                isActive: body.user?.isActive,
                password: body.user?.password,
              },
            );

            return {
              success: true,
              message: 'Member updated successfully',
            };
          },
          dtoWithMiddlewares(
            companyMembersUpdateDto,
            withAuditLog({
              actionType: AuditLogAction.UPDATE,
              entityType: AuditLogEntity.USER,
              getEntityUuid: ({ params }) => params.userId!,
              getDescription: () => 'Company member güncellendi',
            }),
          ),
        )
        /**
         * PUT /organizations/company/:organizationUuid/members/:userId/avatar
         * Update company member avatar
         */
        .put(
          '/:organizationUuid/members/:userId/avatar',
          async ({ params, body }) => {
            // Verify member exists in this company
            const member = await OrganizationsService.getMember(
              OrganizationType.COMPANY,
              params.organizationUuid,
              params.userId,
            );

            if (!member) {
              throw new Error('Member not found in this company');
            }

            // Upload file
            const fileLibraryAsset = await FileLibraryAssetsService.store({
              file: body.file,
              type: FileLibraryAssetType.USER_IMAGE,
              companyUuid: params.organizationUuid,
            });

            // Update user record
            await prisma.user.update({
              where: { id: params.userId },
              data: {
                image: fileLibraryAsset.path,
                imageId: fileLibraryAsset.id,
              },
            });

            return {
              success: true,
              message: 'Avatar updated successfully',
              avatarUrl: fileLibraryAsset.path,
            };
          },
          dtoWithMiddlewares(
            companyMemberAvatarUpdateDto,
            withAuditLog({
              actionType: AuditLogAction.UPDATE,
              entityType: AuditLogEntity.USER,
              getEntityUuid: ({ params }) => params.userId!,
              getDescription: () => 'Company member avatar güncellendi',
            }),
          ),
        )
    )
    /**
     * Generic organization endpoints
     * /organizations/:organizationType/...
     */
    .group('/:organizationType', (app) =>
      app
        /**
         * DELETE /organizations/:organizationType/:organizationUuid/members/:userId
         * Remove a member from an organization (generic - works for all org types)
         */
        .delete(
          '/:organizationUuid/members/:userId',
          async ({ params, user }) => {
            const organizationType = params.organizationType as OrganizationType;

            await OrganizationsService.removeMember(
              organizationType,
              params.organizationUuid,
              params.userId,
              user!,
            );
            return { success: true };
          },
          dtoWithMiddlewares(
            membersDestroyDto,
            withAuditLog({
              actionType: AuditLogAction.DELETE,
              entityType: AuditLogEntity.USER,
              getEntityUuid: ({ params }) => params.userId!,
              getDescription: ({ params }) =>
                `Kullanıcı ${params.organizationType} organizasyonundan çıkarıldı`,
            }),
          ),
        ),
    ),
);

export default app;
