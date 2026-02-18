import { BadRequestException, ConflictException, NotFoundException } from '#utils/http-errors.ts';
import type { PaginationQuery } from '#utils/pagination.ts';
import prisma from '@onlyjs/db';
import { Prisma, type Company } from '@onlyjs/db/client';
import { RoleType } from '@onlyjs/db/enums';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { isPermissionGrantedToUser, PERMISSIONS } from '../auth';
import { OrganizationType } from '@onlyjs/db/enums';
import { invalidateUserClaimsAndRoles } from '../auth/authorization/claims/service';
import {
  getOrganizationUuids,
  UserMembershipsService,
} from '../auth/authorization/user-memberships';
import { UsersService } from '../users';
import type { CompanyCreatePayload, CompanyUpdatePayload } from './types';

export abstract class CompanyService {
  static async index(
    query: PaginationQuery & { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
    userId?: string,
  ): Promise<{
    data: Company[];
    total: number;
  }> {
    try {
      const { page = 1, perPage = 20, search, sortBy = 'name', sortOrder = 'asc' } = query;
      const skip = (page - 1) * perPage;

      let where: Prisma.CompanyWhereInput = {
        deletedAt: null,
      };

      // If userId is provided, check if user has permission to view all companies
      if (userId) {
        const canViewAll = await isPermissionGrantedToUser(
          { id: userId },
          PERMISSIONS.COMPANIES.SHOW,
        );

        // If user doesn't have global permission, filter by cached memberships
        if (!canViewAll) {
          // Get user's company UUIDs from cached memberships (fast!)
          const memberships = await UserMembershipsService.getUserMemberships(userId);
          const companyUuids = getOrganizationUuids(memberships, OrganizationType.COMPANY);

          if (companyUuids.length === 0) {
            // User has no memberships, return empty result
            return { data: [], total: 0 };
          }

          where = {
            ...where,
            uuid: {
              in: companyUuids,
            },
          };
        }
      }

      // Add search filter if provided
      if (search) {
        where = {
          ...where,
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        };
      }

      // Build orderBy based on sortBy parameter
      const orderBy: Prisma.CompanyOrderByWithRelationInput =
        sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : sortBy === 'updatedAt'
            ? { updatedAt: sortOrder }
            : { name: sortOrder };

      const [data, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip,
          take: perPage,
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy,
        }),
        prisma.company.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      console.error('❌ Company index error:', error);
      throw new Error('Company listing failed');
    }
  }

  static async show(uuid: string): Promise<Company> {
    try {
      const company = await prisma.company.findUnique({
        where: { uuid, deletedAt: null },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Company bulunamadı');
      }

      return company;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Company lookup failed');
    }
  }

  static async store(data: CompanyCreatePayload, tx?: Prisma.TransactionClient): Promise<Company> {
    // Type guards for union type
    const hasCreateOwner = 'createOwner' in data;
    const hasOwnerUserId = 'ownerUserId' in data;

    try {
      // TODO: logoFileId'yi file service'den resolve et
      const logoFileSrc = data.logoFileId ? `/files/${data.logoFileId}` : null;

      const executeInTransaction = async (txClient: Prisma.TransactionClient) => {
        let ownerId: string;

        // Option 1: Create new owner user
        if (hasCreateOwner) {
          const newOwner = await UsersService.store(
            {
              ...data.createOwner,
              roleUuids: [], // UsersService will automatically assign 'user' (basic) role if empty
              imageFile: undefined,
            },
            txClient, // Transaction client
            true, // skipRoleValidation - allow basic role assignment during user creation
          );

          ownerId = newOwner.id;
        }
        // Option 2: Use existing user as owner
        else if (hasOwnerUserId) {
          ownerId = data.ownerUserId;

          // 🔄 RESTORE: If user is soft-deleted, restore them
          const user = await txClient.user.findUnique({
            where: { id: ownerId },
            select: { id: true, deletedAt: true },
          });

          if (!user) {
            throw new NotFoundException(`Owner kullanıcısı bulunamadı: ${ownerId}`);
          }

          if (user.deletedAt) {
            await txClient.user.update({
              where: { id: ownerId },
              data: { deletedAt: null },
            });
          }
        } else {
          throw new BadRequestException(
            'Company owner gereklidir. ownerUserId veya createOwner sağlanmalıdır.',
          );
        }

        // Create company with owner
        const createdCompany = await txClient.company.create({
          data: {
            name: data.name,
            logoFileSrc,
            ownerId,
            ownerUuid: ownerId,
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                image: true,
              },
            },
          },
        });

        // 🔐 Create default BASIC role (required for every company)
        await txClient.role.create({
          data: {
            type: RoleType.BASIC,
            name: 'Member',
            description: 'Basic member role for this company',
            permissions: [], // Basic permissions - can be updated
            order: 1, // Lower priority
            organizationType: OrganizationType.COMPANY,
            organizationId: createdCompany.id,
            organizationUuid: createdCompany.uuid,
          },
        });

        // 🔐 Create default ADMIN role (required for every company)
        const adminRole = await txClient.role.create({
          data: {
            type: RoleType.ADMIN,
            name: 'Admin',
            description: 'Admin role for this company',
            permissions: ['*'], // All permissions - immutable
            order: 1000, // Higher priority
            organizationType: OrganizationType.COMPANY,
            organizationId: createdCompany.id,
            organizationUuid: createdCompany.uuid,
          },
        });

        // 👤 Add owner as admin member and assign ADMIN role
        await txClient.companyMember.create({
          data: {
            userId: ownerId,
            companyId: createdCompany.id,
            isAdmin: true,
          },
        });

        // Increment membersCount for owner
        await txClient.company.update({
          where: { id: createdCompany.id },
          data: { membersCount: { increment: 1 } },
        });

        // Assign ADMIN role to owner
        await txClient.userRole.create({
          data: {
            userId: ownerId,
            roleId: adminRole.id,
            organizationType: OrganizationType.COMPANY,
            organizationId: createdCompany.id,
          },
        });

        return createdCompany;
      };

      // If transaction is provided, use it; otherwise create a new one
      const company = tx
        ? await executeInTransaction(tx)
        : await prisma.$transaction(executeInTransaction);

      // Invalidate cache after successful transaction
      await invalidateUserClaimsAndRoles(company.ownerId!);

      return company;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Company ismi zaten kullanılıyor');
      }
      throw error;
    }
  }

  static async update(uuid: string, data: CompanyUpdatePayload): Promise<Company> {
    // Type guards for union type
    const hasCreateOwner = 'createOwner' in data && data.createOwner;
    const hasOwnerUserId = 'ownerUserId' in data && data.ownerUserId;

    try {
      // Önce company'in var olduğunu kontrol et
      const existingCompany = await prisma.company.findUnique({
        where: { uuid, deletedAt: null },
      });

      if (!existingCompany) {
        throw new NotFoundException('Company bulunamadı');
      }

      // TODO: logoFileId'yi file service'den resolve et
      const logoFileSrc = data.logoFileId ? `/files/${data.logoFileId}` : undefined;

      const executeInTransaction = async (txClient: Prisma.TransactionClient) => {
        let newOwnerId: string | undefined;

        // Handle owner change
        if (hasCreateOwner && data.createOwner) {
          // Create new owner user
          const newOwner = await UsersService.store(
            {
              email: data.createOwner.email,
              password: data.createOwner.password,
              firstName: data.createOwner.firstName,
              lastName: data.createOwner.lastName,
              gender: data.createOwner.gender as 'MALE' | 'FEMALE' | 'NON_BINARY',
              isActive: data.createOwner.isActive,
              roleUuids: [],
              imageFile: undefined,
            },
            txClient,
            true, // skipRoleValidation
          );
          newOwnerId = newOwner.id;
        } else if (hasOwnerUserId) {
          // Use existing user as new owner
          newOwnerId = data.ownerUserId;

          // 🔄 RESTORE: If user is soft-deleted, restore them
          const user = await txClient.user.findUnique({
            where: { id: newOwnerId },
            select: { id: true, deletedAt: true },
          });

          if (!user) {
            throw new NotFoundException(`Owner kullanıcısı bulunamadı: ${newOwnerId}`);
          }

          if (user.deletedAt) {
            await txClient.user.update({
              where: { id: newOwnerId },
              data: { deletedAt: null },
            });
          }
        }

        // Update company
        const company = await txClient.company.update({
          where: { uuid },
          data: {
            ...(data.name && { name: data.name }),
            ...(logoFileSrc !== undefined && { logoFileSrc }),
            ...(newOwnerId && { ownerId: newOwnerId, ownerUuid: newOwnerId }),
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                image: true,
              },
            },
          },
        });

        // If owner changed, add new owner as admin member
        if (newOwnerId && newOwnerId !== existingCompany.ownerId) {
          // Get ADMIN role for this company
          const adminRole = await txClient.role.findFirst({
            where: {
              type: RoleType.ADMIN,
              organizationType: OrganizationType.COMPANY,
              organizationId: company.id,
            },
          });

          if (!adminRole) {
            throw new Error('Admin role not found for company');
          }

          // Check if member exists (including soft-deleted)
          const existingMember = await txClient.companyMember.findFirst({
            where: {
              userId: newOwnerId,
              companyId: company.id,
            },
          });

          if (existingMember) {
            // Update existing member
            await txClient.companyMember.update({
              where: { id: existingMember.id },
              data: {
                isAdmin: true,
                deletedAt: null, // Restore if soft-deleted
              },
            });

            // Increment membersCount if member was soft-deleted
            if (existingMember.deletedAt) {
              await txClient.company.update({
                where: { id: company.id },
                data: { membersCount: { increment: 1 } },
              });
            }
          } else {
            // Create new member
            await txClient.companyMember.create({
              data: {
                userId: newOwnerId,
                companyId: company.id,
                isAdmin: true,
              },
            });

            // Increment membersCount for new member
            await txClient.company.update({
              where: { id: company.id },
              data: { membersCount: { increment: 1 } },
            });
          }

          // Assign ADMIN role to new owner
          const existingUserRole = await txClient.userRole.findFirst({
            where: {
              userId: newOwnerId,
              roleId: adminRole.id,
            },
          });

          if (!existingUserRole) {
            await txClient.userRole.create({
              data: {
                userId: newOwnerId,
                roleId: adminRole.id,
                organizationType: OrganizationType.COMPANY,
                organizationId: company.id,
              },
            });
          }

          // Invalidate both old and new owner's cache
          // Old owner keeps their roles, just loses ownership
          if (existingCompany.ownerId) {
            await invalidateUserClaimsAndRoles(existingCompany.ownerId);
          }
          await invalidateUserClaimsAndRoles(newOwnerId);
        }

        return company;
      };

      const company = await prisma.$transaction(executeInTransaction);

      return company;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Company update error:', error);
      throw new Error('Company update failed');
    }
  }

  static async destroy(uuid: string): Promise<Company> {
    try {
      // Önce company'in var olduğunu kontrol et
      const existingCompany = await prisma.company.findUnique({
        where: { uuid, deletedAt: null },
      });

      if (!existingCompany) {
        throw new NotFoundException('Company bulunamadı');
      }

      // Soft delete - deletedAt timestamp'i set et
      const company = await prisma.company.update({
        where: { uuid },
        data: {
          deletedAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return company;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Company destroy error:', error);
      throw new Error('Company deletion failed');
    }
  }
}
