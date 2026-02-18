import { NotFoundException } from '#utils/http-errors.ts';
import prisma from '@onlyjs/db';
import type { Prisma } from '@onlyjs/db/client';
import { RoleType } from '@onlyjs/db/client';
import type { Writable } from 'type-fest';
import { COMPANY_DEFAULT_ROLES } from '../../roles/constants';
import { UserMembershipsService } from '../../user-memberships/service';
import { BaseOrganizationAdapter } from '../base-adapter';
import { OrganizationType, UserScope } from '@onlyjs/db/enums';
import type { MemberData } from '../types';
import type { CompanyMemberData } from '../types/company.types';

/**
 * Company adapter - Company tablosu için organization adapter
 */
export class CompanyOrganizationAdapter extends BaseOrganizationAdapter {
  readonly organizationType = OrganizationType.COMPANY;

  /**
   * 🔒 Membership Configuration for Company Organizations
   *
   * - deleteUserOnRemoval: false - Users can exist outside of companies
   * - maxMembershipsPerUser: null - Users can join unlimited companies
   */
  protected override readonly membershipConfig = {
    deleteUserOnRemoval: false,
    maxMembershipsPerUser: null,
  };

  // ========================================================================
  // 🔧 Private Helper Methods - isAdmin Management
  // ========================================================================

  /**
   * Calculates whether a user should be marked as admin for a company
   * Based on whether they have at least one ADMIN type role in that company
   */
  private async calculateIsAdmin(
    userId: string,
    companyId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx || prisma;

    // Check if user has any ADMIN type role for this company
    const adminRoleCount = await client.userRole.count({
      where: {
        userId,
        organizationType: this.organizationType,
        organizationId: companyId,
        role: {
          type: RoleType.ADMIN,
        },
      },
    });

    return adminRoleCount > 0;
  }

  /**
   * Updates the isAdmin field for a company member
   * This should be called whenever user roles change
   */
  private async updateCompanyMemberIsAdmin(
    userId: string,
    companyId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;

    const isAdmin = await this.calculateIsAdmin(userId, companyId, client);

    await client.companyMember.updateMany({
      where: {
        userId,
        companyId,
      },
      data: {
        isAdmin,
      },
    });
  }

  // ========================================================================
  // 🎯 Organization Implementation
  // ========================================================================

  // 🎯 Override default roles for company
  protected override getDefaultRoles() {
    const roles = [COMPANY_DEFAULT_ROLES.BASIC, COMPANY_DEFAULT_ROLES.ADMIN] as const;
    return roles as Writable<typeof roles>;
  }

  // 🎯 Organization initialization - creates default roles and sets owner
  override async initialize(
    organizationUuid: string,
    ownerUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || prisma;

    const companyId = await this.getOrganizationId(organizationUuid);
    if (!companyId) {
      throw new NotFoundException(`Company not found: ${organizationUuid}`);
    }

    // 1. Create default roles (BASIC + ADMIN)
    const createdRoles = await this.createDefaultRoles(companyId, client);

    // 2. Set owner in company table
    await client.company.update({
      where: { id: companyId },
      data: {
        ownerId: ownerUuid,
        ownerUuid: ownerUuid,
      },
    });

    // 3. Add owner as member (initially isAdmin will be false since no role yet)
    await this.addMember(ownerUuid, companyId, { id: ownerUuid }, client);

    // 4. Assign ADMIN role to owner
    const adminRole = createdRoles.find((role) => role.type === 'ADMIN');
    if (adminRole) {
      await client.userRole.create({
        data: {
          userId: ownerUuid,
          roleId: adminRole.id,
        },
      });

      // 5. Update isAdmin after role assignment
      await this.updateCompanyMemberIsAdmin(ownerUuid, companyId, client);
    }
  }

  // 🔒 Get organization owner
  override async getOwnerUuid(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null> {
    const client = tx || prisma;

    const company = await client.company.findUnique({
      where: { uuid: organizationUuid },
      select: { ownerUuid: true },
    });

    return company?.ownerUuid ?? null;
  }

  // 🔒 Get organization name
  override async getOrganizationName(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null> {
    const client = tx || prisma;

    const company = await client.company.findUnique({
      where: { uuid: organizationUuid },
      select: { name: true },
    });

    return company?.name ?? null;
  }

  // 🔒 Get organization logo source
  override async getOrganizationLogoSrc(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string | null> {
    const client = tx || prisma;

    const company = await client.company.findUnique({
      where: { uuid: organizationUuid },
      select: { logoFileSrc: true },
    });

    return company?.logoFileSrc ?? null;
  }

  // 🔒 Get organization details (optimized - single query)
  override async getOrganizationDetails(
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    uuid: string;
    name: string;
    logoSrc: string | null;
    ownerUuid: string;
  } | null> {
    const client = tx || prisma;

    const company = await client.company.findUnique({
      where: { uuid: organizationUuid },
      select: {
        uuid: true,
        name: true,
        logoFileSrc: true,
        ownerUuid: true,
      },
    });

    if (!company) {
      return null;
    }

    return {
      uuid: company.uuid,
      name: company.name,
      logoSrc: company.logoFileSrc,
      ownerUuid: company.ownerUuid!,
    };
  }

  // 🔒 Check if user is owner
  override async isOwner(
    userId: string,
    organizationUuid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx || prisma;

    const company = await client.company.findUnique({
      where: { uuid: organizationUuid },
      select: { ownerUuid: true },
    });

    return company?.ownerUuid === userId;
  }

  // 🗄️ Protected - DB fetch methods (called on cache miss)
  protected override async fetchOrganizationUuid(companyId: number): Promise<string | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { uuid: true },
    });

    return company?.uuid ?? null;
  }

  protected override async fetchOrganizationUuids(
    companyIds: number[],
  ): Promise<Record<number, string>> {
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, uuid: true },
    });

    const result: Record<number, string> = {};
    for (const company of companies) {
      result[company.id] = company.uuid;
    }

    return result;
  }

  protected override async fetchOrganizationId(companyUuid: string): Promise<number | null> {
    const company = await prisma.company.findUnique({
      where: { uuid: companyUuid },
      select: { id: true },
    });

    return company?.id ?? null;
  }

  /**
   * Get ALL members of a company with their member-specific data
   * Fetches from CompanyMember table to ensure we get ALL members
   */
  override async getAllMembersData(
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, MemberData>> {
    const client = tx || prisma;

    const members = await client.companyMember.findMany({
      where: {
        companyId: organizationId,
        deletedAt: null, // Only active members
      },
    });

    const result = new Map();

    for (const member of members) {
      result.set(member.userId, {
        isAdmin: member.isAdmin,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    }

    return result;
  }

  override async isMember(
    userId: string,
    organizationId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx || prisma;

    const member = await client.companyMember.findFirst({
      where: {
        userId,
        companyId: organizationId,
        deletedAt: null, // Only active members
      },
      select: { id: true },
    });

    return member !== null;
  }

  override async addMember(
    userId: string,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const client = tx || prisma;

    // 🔒 SECURITY: Ensure user has COMPANY scope when adding to company
    // System scope users can be added to companies, but company members must have COMPANY scope
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { scope: true },
    });

    if (user && user.scope === UserScope.SYSTEM) {
      // System users can be added to companies (they have access to everything)
      // No need to change their scope
    } else {
      // Ensure user has COMPANY scope
      await client.user.update({
        where: { id: userId },
        data: { scope: UserScope.COMPANY },
      });
    }

    // Check if soft-deleted member exists
    const existingMember = await client.companyMember.findFirst({
      where: {
        userId,
        companyId: organizationId,
      },
    });

    if (existingMember) {
      // Restore soft-deleted member
      await client.companyMember.update({
        where: { id: existingMember.id },
        data: {
          deletedAt: null, // Restore
          isAdmin: false, // Reset admin status (will be recalculated by role hooks)
          updatedAt: new Date(),
        },
      });

      // Increment membersCount if member was soft-deleted
      if (existingMember.deletedAt) {
        await client.company.update({
          where: { id: organizationId },
          data: { membersCount: { increment: 1 } },
        });
      }
    } else {
      // Create new member
      await client.companyMember.create({
        data: {
          userId,
          companyId: organizationId,
          // isAdmin = false (yeni üye henüz role sahip değil)
          // afterAddRole hook'u rol atandığında bunu güncelleyecek
          isAdmin: false,
        },
      });

      // Increment membersCount for new member
      await client.company.update({
        where: { id: organizationId },
        data: { membersCount: { increment: 1 } },
      });
    }

    // Note: Membership cache invalidation is handled by the caller (OrganizationsService)
    // after transaction completes
  }

  /**
   * 🔧 Remove member from company
   * Implements doRemoveMember from base adapter
   */
  protected async doRemoveMember(
    userId: string,
    organizationId: number,
    currentUser: { id: string },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx;

    // Owner silinmeye çalışılıyor mu kontrol et
    const company = await client.company.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    if (company?.ownerId === userId) {
      throw new Error('Cannot remove owner from organization. Transfer ownership first.');
    }

    // CompanyMember tablosundan kayıt soft-delete
    const deletedCount = await client.companyMember.updateMany({
      where: {
        userId,
        companyId: organizationId,
        deletedAt: null, // Only soft-delete active members
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (deletedCount.count === 0) {
      throw new Error(`User is not a member of this ${this.organizationType}`);
    }

    // Decrement membersCount
    await client.company.update({
      where: { id: organizationId },
      data: { membersCount: { decrement: 1 } },
    });

    // Note: Membership cache invalidation is handled by the caller (OrganizationsService)
    // after transaction completes
  }

  /**
   * Override getMemberData to use CompanyMember table and include other data if needed
   * More efficient than calculating from roles
   */
  override async getMemberData(
    userId: string,
    companyId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<CompanyMemberData> {
    const client = tx || prisma;

    const companyMember = await client.companyMember.findFirst({
      where: {
        userId,
        companyId,
        deletedAt: null, // Only active members
      },
      select: {
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      isAdmin: companyMember?.isAdmin || false,
      createdAt: companyMember?.createdAt || new Date(),
      updatedAt: companyMember?.updatedAt || new Date(),
    };
  }

  /**
   * Override getBatchMemberData to use CompanyMember table (batch) and include other data if needed
   * Much more efficient than calculating from roles one-by-one
   */
  override async getBatchMemberData(
    userIds: string[],
    companyId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, CompanyMemberData>> {
    const client = tx || prisma;
    const result = new Map<string, CompanyMemberData>();

    // Fetch all company members
    const companyMembers = await client.companyMember.findMany({
      where: {
        userId: { in: userIds },
        companyId,
      },
      select: {
        userId: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Map to result
    for (const member of companyMembers) {
      result.set(member.userId, {
        isAdmin: member.isAdmin,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    }

    // Fill missing entries with defaults
    for (const userId of userIds) {
      if (!result.has(userId)) {
        result.set(userId, {
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return result;
  }

  /**
   * After role add hook - Update isAdmin status
   * Note: Membership cache invalidation is handled by RoleAssignmentService
   * after transaction completes
   */
  override async afterAddRole(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.updateCompanyMemberIsAdmin(userId, organizationId, tx);
  }

  /**
   * After role remove hook - Update isAdmin status
   * Note: Membership cache invalidation is handled by RoleAssignmentService
   * after transaction completes
   */
  override async afterRemoveRole(
    userId: string,
    roleId: number,
    organizationId: number,
    currentUser: { id: string },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.updateCompanyMemberIsAdmin(userId, organizationId, tx);
  }

  /**
   * Get user's company memberships in UserMembership format
   */
  override async getUserMemberships(userId: string): Promise<
    Array<{
      organizationType: OrganizationType;
      organizationUuid: string;
      isAdmin?: true;
      isOwner?: true;
      joinedAt: string;
    }>
  > {
    const companyMembers = await prisma.companyMember.findMany({
      where: {
        userId,
        deletedAt: null, // Only active memberships
      },
      include: {
        company: {
          select: {
            uuid: true,
            ownerUuid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return companyMembers.map((member) => {
      const membership: {
        organizationType: OrganizationType;
        organizationUuid: string;
        isAdmin?: true;
        isOwner?: true;
        joinedAt: string;
      } = {
        organizationType: this.organizationType,
        organizationUuid: member.company.uuid,
        joinedAt: member.createdAt.toISOString(),
      };

      // Only include flags when true (to save space)
      if (member.isAdmin) {
        membership.isAdmin = true;
      }

      if (member.company.ownerUuid === userId) {
        membership.isOwner = true;
      }

      return membership;
    });
  }

  /**
   * Invalidate membership cache for a user
   */
  override async invalidateUserMemberships(userId: string): Promise<void> {
    await UserMembershipsService.invalidateUserMemberships(userId);
  }

  /**
   * Invalidate membership cache for all users in a company
   */
  override async invalidateMembershipsForOrganization(organizationId: number): Promise<void> {
    // Find all users who are members of this company
    const members = await prisma.companyMember.findMany({
      where: {
        companyId: organizationId,
      },
      select: {
        userId: true,
      },
    });

    const userIds = members.map((m) => m.userId);

    if (userIds.length === 0) {
      return;
    }

    // Invalidate each user's membership cache
    await Promise.all(
      userIds.map((userId) => UserMembershipsService.invalidateUserMemberships(userId)),
    );
  }
}
