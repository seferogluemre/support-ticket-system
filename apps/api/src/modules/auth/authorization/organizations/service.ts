import { AuthenticationService } from '#modules/auth/authentication/service';
import { UsersService } from '#modules/users/service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '#utils/http-errors.ts';
import prisma from '@onlyjs/db';
import type { User } from '@onlyjs/db/client';
import type { Gender } from '@onlyjs/db/enums';
import { generateUserClaims, invalidateUserClaimsAndRoles, matchesWildcard } from '../claims/service';
import { PERMISSIONS } from '../permissions';
import { RoleAssignmentService } from '../roles/role-assignment.service';
import { UserMembershipsService } from '../user-memberships';
import { OrganizationType } from '@onlyjs/db/enums';
import { organizationRegistry } from './registry';
import type {
  OrganizationMember,
  OrganizationMemberDetails,
  OrganizationMembershipSummary,
} from './types';

export abstract class OrganizationsService {
  /**
   * Get all members of an organization with their roles and details
   * Works for any organization type (COMPANY, etc.)
   * Returns enhanced members if adapter provides enhanceMember method
   */
  static async getMembers<T = OrganizationMember>(
    organizationType: OrganizationType,
    organizationUuid: string,
  ): Promise<T[]> {
    // Get adapter for this organization type
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new NotFoundException(`Organization adapter not found for type: ${organizationType}`);
    }

    // Get organization ID from UUID
    const organizationId = await adapter.getOrganizationId(organizationUuid);
    if (!organizationId) {
      throw new NotFoundException('Organization bulunamadı');
    }

    // Get owner UUID for isOwner check
    const ownerUuid = await adapter.getOwnerUuid(organizationUuid);

    // Get member-specific data first (e.g., from CompanyMember table)
    // This ensures we get ALL members, not just those with organization-specific roles
    const memberDataMap = await adapter.getAllMembersData(organizationId);
    const uniqueUserIds = Array.from(memberDataMap.keys());

    // Fetch user details for all members
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        image: true,
        isActive: true,
        createdAt: true,
      },
    });

    const userDetailsMap = new Map(users.map((u) => [u.id, u]));

    // Get all organization-specific roles for these members
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: { in: uniqueUserIds },
        organizationType,
        organizationId,
      },
      include: {
        role: {
          select: {
            uuid: true,
            name: true,
            type: true,
            order: true,
          },
        },
      },
      orderBy: [{ role: { order: 'desc' } }],
    });

    // Group roles by userId
    const rolesMap = new Map<string, typeof userRoles>();
    for (const ur of userRoles) {
      if (!rolesMap.has(ur.userId)) {
        rolesMap.set(ur.userId, []);
      }
      rolesMap.get(ur.userId)!.push(ur);
    }

    // Build member list
    const userMap = new Map<string, T>();

    for (const userId of uniqueUserIds) {
      const userDetails = userDetailsMap.get(userId);
      if (!userDetails) continue; // Skip if user not found

      const memberData = memberDataMap.get(userId) || {
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userRolesForMember = rolesMap.get(userId) || [];

      // Extract standard fields and spread the rest
      const { isAdmin, createdAt, updatedAt, ...extraFields } = memberData;

      userMap.set(userId, {
        userId: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        name: userDetails.name,
        image: userDetails.image,
        isActive: userDetails.isActive,
        isAdmin,
        isOwner: userDetails.id === ownerUuid,
        joinedAt: createdAt,
        membershipUpdatedAt: updatedAt,
        userCreatedAt: userDetails.createdAt,
        roles: userRolesForMember.map((ur) => ({
          uuid: ur.role.uuid,
          name: ur.role.name,
          type: ur.role.type,
          order: ur.role.order,
          assignedAt: ur.createdAt,
        })),
        ...extraFields, // Spread extra fields
      } as T);
    }

    return Array.from(userMap.values());
  }

  /**
   * Get detailed information about a specific organization member
   * Returns enhanced member details if adapter provides extended MemberData
   */
  static async getMember<T = OrganizationMemberDetails>(
    organizationType: OrganizationType,
    organizationUuid: string,
    userId: string,
  ): Promise<T> {
    // Get adapter for this organization type
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new NotFoundException(`Organization adapter not found for type: ${organizationType}`);
    }

    // Get organization ID from UUID
    const organizationId = await adapter.getOrganizationId(organizationUuid);
    if (!organizationId) {
      throw new NotFoundException('Organization bulunamadı');
    }

    // Check if user is a member
    const isMember = await adapter.isMember(userId, organizationId);
    if (!isMember) {
      throw new NotFoundException("Kullanıcı bu organization'ın üyesi değil");
    }

    // Get owner UUID for isOwner check
    const ownerUuid = await adapter.getOwnerUuid(organizationUuid);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        image: true,
        gender: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Get member-specific data using adapter's getMemberData method
    const memberData = await adapter.getMemberData(userId, organizationId);

    // Get detailed roles with permissions
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: userId,
        organizationType,
        organizationId,
      },
      include: {
        role: {
          select: {
            uuid: true,
            name: true,
            description: true,
            type: true,
            order: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        role: {
          order: 'desc',
        },
      },
    });

    // Extract standard fields and spread the rest
    const { isAdmin, createdAt, updatedAt, ...extraFields } = memberData;

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      image: user.image,
      gender: user.gender,
      isActive: user.isActive,
      isAdmin,
      isOwner: user.id === ownerUuid,
      joinedAt: createdAt,
      membershipUpdatedAt: updatedAt,
      userCreatedAt: user.createdAt,
      userUpdatedAt: user.updatedAt,
      roles: userRoles.map((ur) => ({
        uuid: ur.role.uuid,
        name: ur.role.name,
        description: ur.role.description,
        type: ur.role.type,
        order: ur.role.order,
        permissions: ur.role.permissions,
        assignedAt: ur.createdAt,
      })),
      ...extraFields, // Spread extra fields
    } as T;
  }

  /**
   * Add a member to an organization (with optional roles and user creation)
   *
   * @param organizationType Organization type
   * @param organizationUuid Organization UUID
   * @param options User UUID or user creation data
   * @param currentUser Current user performing the action
   * @param roleUuids Optional array of role UUIDs to assign
   * @param extraData Adapter-specific extra data
   * @returns Object with userId and whether user was created
   */
  static async addMember(
    organizationType: OrganizationType,
    organizationUuid: string,
    options: {
      userId?: string;
      createUser?: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        gender: Gender;
        isActive?: boolean;
      };
    },
    currentUser: User,
    roleUuids?: string[],
    extraData?: Record<string, unknown>,
  ): Promise<{ userId: string; created: boolean }> {
    // Validate options: either userId or createUser must be provided
    if (!options.userId && !options.createUser) {
      throw new BadRequestException('Either userId or createUser must be provided');
    }

    if (options.userId && options.createUser) {
      throw new BadRequestException('Cannot provide both userId and createUser');
    }

    // Get adapter and organization ID
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new NotFoundException(`Organization adapter not found for type: ${organizationType}`);
    }

    const organizationId = await adapter.getOrganizationId(organizationUuid);
    if (!organizationId) {
      throw new NotFoundException('Organization bulunamadı');
    }

    // 🛡️ PERMISSION CHECK: Can current user add members?
    await RoleAssignmentService.ensureUserCanAddMembers(
      organizationType,
      organizationId,
      currentUser,
    );

    let userId: string;
    let userCreated = false;

    // 🔒 MAX MEMBERSHIPS CHECK: Validate using adapter's method
    if (options.userId) {
      await adapter.validateMembershipConstraints(options.userId, organizationId);
    }

    // Transaction: Create user (if needed) + Add member + Assign roles
    await prisma.$transaction(async (tx) => {
      // Option 1: Create new user
      if (options.createUser) {
        const newUser = await UsersService.store(
          {
            ...options.createUser,
            roleUuids: [], // UsersService will automatically assign 'user' (basic) role if empty
            imageFile: undefined,
          },
          tx, // Transaction client
          true, // skipRoleValidation - allow basic role assignment during user creation
        );

        userId = newUser.id;
        userCreated = true;
      }
      // Option 2: Use existing user
      else {
        userId = options.userId!;

        // 🔄 RESTORE: If user is soft-deleted, restore them
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, deletedAt: true },
        });

        if (user?.deletedAt) {
          await tx.user.update({
            where: { id: userId },
            data: { deletedAt: null },
          });
        }

        // 🛡️ MEMBERSHIP CHECK: Is user already a member?
        const isAlreadyMember = await adapter.isMember(userId, organizationId, tx);
        if (isAlreadyMember) {
          throw new ConflictException(`Kullanıcı bu ${organizationType} organizasyonuna zaten üye`);
        }
      }

      // Add member using adapter (with extra data for adapter-specific logic)
      await adapter.addMember(userId, organizationId, currentUser, tx, extraData);

      // Assign roles if provided (UUIDs only)
      // Note: RoleAssignmentService.addRolesToUser handles all validations:
      // - Permission checks
      // - Hierarchy checks
      // - Permission guardrails
      if (!roleUuids || roleUuids.length === 0) {
        throw new BadRequestException('En az bir rol ataması gereklidir');
      }
      await RoleAssignmentService.addRolesToUser(roleUuids, userId, currentUser, tx);
    });

    // Invalidate user's claims, roles, and memberships cache
    await invalidateUserClaimsAndRoles(userId!);
    await UserMembershipsService.invalidateUserMemberships(userId!);

    return {
      userId: userId!,
      created: userCreated,
    };
  }

  /**
   * Update a member's roles and organization-specific data
   * Replaces existing roles and updates extra data
   */
  static async updateMember(
    organizationType: OrganizationType,
    organizationUuid: string,
    userId: string,
    currentUser: User,
    roleUuids?: string[],
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    // Get adapter and organization ID
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new NotFoundException(`Organization adapter not found for type: ${organizationType}`);
    }

    const organizationId = await adapter.getOrganizationId(organizationUuid);
    if (!organizationId) {
      throw new NotFoundException('Organization bulunamadı');
    }

    // 🛡️ MEMBERSHIP CHECK: Is user a member?
    const isMember = await adapter.isMember(userId, organizationId, undefined);
    if (!isMember) {
      throw new NotFoundException(`Kullanıcı bu ${organizationType} organizasyonuna üye değil`);
    }

    // 🛡️ PERMISSION CHECK: Can current user manage members?
    await RoleAssignmentService.ensureUserCanAddMembers(
      organizationType,
      organizationId,
      currentUser,
    );

    // 🛡️ SECURITY: Cannot modify own roles (unless has global ALL_ORGANIZATIONS permission)
    if (currentUser.id === userId && roleUuids !== undefined) {
      const claims = await generateUserClaims(currentUser.id);
      const hasGlobalManagePermission = Boolean(
        claims.global.includes('*') ||
        claims.global.some((perm) =>
          matchesWildcard(PERMISSIONS.USER_ROLES.ASSIGN_ROLE_ALL_ORGANIZATIONS.key, perm)
        )
      );
      
      if (!hasGlobalManagePermission) {
        throw new ForbiddenException('Kendi rollerinizi değiştiremezsiniz');
      }
    }

    // Prepare user update data outside transaction (for later invalidation check)
    const userUpdateData: Record<string, unknown> = {};
    if (extraData) {
      if (extraData.firstName) userUpdateData.firstName = extraData.firstName;
      if (extraData.lastName) userUpdateData.lastName = extraData.lastName;
      if (extraData.email) userUpdateData.email = extraData.email;
      if (extraData.gender) userUpdateData.gender = extraData.gender;
      if (extraData.isActive !== undefined) userUpdateData.isActive = extraData.isActive;
      
    }

    // 🔐 PASSWORD UPDATE (for company organizations only)
    // Password is stored in Account table (better-auth), not User table
    let hashedPassword: string | undefined;
    if (extraData?.password && organizationType === OrganizationType.COMPANY) {
      // Hash the new password
      hashedPassword = await AuthenticationService.hashPassword(extraData.password as string);
    }

    // Transaction: Update user data, roles and member data
    await prisma.$transaction(async (tx) => {
      // Update user information if provided in extraData
      if (Object.keys(userUpdateData).length > 0) {
        // Compute name if firstName or lastName changed
        if (extraData?.firstName || extraData?.lastName) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
          });
          const firstName = (extraData.firstName as string) || user?.firstName || '';
          const lastName = (extraData.lastName as string) || user?.lastName || '';
          userUpdateData.name = `${firstName} ${lastName}`.trim();
        }

        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      // 🔐 Update password in Account table (better-auth stores password there)
      if (hashedPassword) {
        await tx.account.updateMany({
          where: {
            userId,
            providerId: 'credential', // Only update credential provider accounts
          },
          data: {
            password: hashedPassword,
          },
        });
      }

      // Update roles if provided
      if (roleUuids !== undefined) {
        // Validate: At least one role must be assigned
        if (!roleUuids || roleUuids.length === 0) {
          throw new BadRequestException('En az bir rol ataması gereklidir');
        }

        // Get current roles
        const currentRoles = await tx.userRole.findMany({
          where: {
            userId,
            organizationType,
            organizationId,
          },
          include: {
            role: true,
          },
        });

        // Remove all current roles
        if (currentRoles.length > 0) {
          const currentRoleUuids = currentRoles.map((ur) => ur.role.uuid);
          await RoleAssignmentService.removeRolesFromUser(
            currentRoleUuids,
            userId,
            currentUser,
            tx,
          );
        }

        // Add new roles (UUIDs only)
        await RoleAssignmentService.addRolesToUser(roleUuids, userId, currentUser, tx);
      }
    });

    // Invalidate user claims, roles, and memberships cache
    await invalidateUserClaimsAndRoles(userId);
    await UserMembershipsService.invalidateUserMemberships(userId);
  }

  /**
   * Remove a member from an organization (removes all roles and membership)
   *
   * @param organizationType Organization type
   * @param organizationUuid Organization UUID
   * @param userId User UUID to remove
   * @param currentUser Current user performing the action
   */
  static async removeMember(
    organizationType: OrganizationType,
    organizationUuid: string,
    userId: string,
    currentUser: User,
  ): Promise<void> {
    // Get adapter and organization ID
    const adapter = organizationRegistry.get(organizationType);
    if (!adapter) {
      throw new NotFoundException(`Organization adapter not found for type: ${organizationType}`);
    }

    const organizationId = await adapter.getOrganizationId(organizationUuid);
    if (!organizationId) {
      throw new NotFoundException('Organization bulunamadı');
    }

    // 🛡️ MEMBERSHIP CHECK: Is user a member?
    const isMember = await adapter.isMember(userId, organizationId, undefined);
    if (!isMember) {
      throw new NotFoundException(`Kullanıcı bu ${organizationType} organizasyonuna üye değil`);
    }

    // 🛡️ OWNER CHECK: Cannot remove organization owner
    const isOwner = await adapter.isOwner(userId, organizationUuid, undefined);
    if (isOwner) {
      throw new ForbiddenException('Organization owner\'ı silinemez');
    }

    // 🛡️ PERMISSION CHECK: Can current user remove members?
    await RoleAssignmentService.ensureUserCanRemoveMembers(
      organizationType,
      organizationId,
      currentUser,
    );

    // Get all user roles in this organization
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: userId,
        organizationType,
        organizationId,
      },
      include: {
        role: {
          select: {
            uuid: true,
          },
        },
      },
    });

    // Transaction: Remove roles, member, and optionally soft-delete user
    await prisma.$transaction(async (tx) => {
      // Remove all roles first
      if (userRoles.length > 0) {
        const roleUuids = userRoles.map((ur) => ur.role.uuid);
        await RoleAssignmentService.removeRolesFromUser(roleUuids, userId, currentUser, tx);
      }

      // Remove member using adapter (includes auto-deletion if configured)
      await adapter.removeMember(userId, organizationId, currentUser, tx);
    });

    // Invalidate user's claims, roles, and memberships cache
    await invalidateUserClaimsAndRoles(userId);
    await UserMembershipsService.invalidateUserMemberships(userId);
  }

  /**
   * Get current user's memberships across all organization types
   * Returns a unified view of all organizations the user belongs to
   *
   * @param userId User ID
   * @returns Array of organization membership summaries
   */
  static async getCurrentUserMemberships(userId: string): Promise<OrganizationMembershipSummary[]> {
    // Get all user roles grouped by organization
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            uuid: true,
            name: true,
            type: true,
            order: true,
            organizationType: true,
            organizationId: true,
          },
        },
      },
      orderBy: [
        { role: { organizationType: 'asc' } },
        { role: { organizationId: 'asc' } },
        { role: { order: 'desc' } },
      ],
    });

    // Group roles by organization
    const organizationMap = new Map<
      string,
      {
        organizationType: OrganizationType;
        organizationId: number;
        roles: Array<{
          uuid: string;
          name: string;
          type: string;
          order: number;
        }>;
      }
    >();

    for (const ur of userRoles) {
      if (!ur.role.organizationType || !ur.role.organizationId) continue;

      const orgKey = `${ur.role.organizationType}:${ur.role.organizationId}`;
      if (!organizationMap.has(orgKey)) {
        organizationMap.set(orgKey, {
          organizationType: ur.role.organizationType,
          organizationId: ur.role.organizationId,
          roles: [],
        });
      }

      organizationMap.get(orgKey)!.roles.push({
        uuid: ur.role.uuid,
        name: ur.role.name,
        type: ur.role.type,
        order: ur.role.order,
      });
    }

    // Fetch organization details and member data for each organization
    const memberships: OrganizationMembershipSummary[] = [];

    for (const [orgKey, orgData] of organizationMap) {
      const adapter = organizationRegistry.get(orgData.organizationType as OrganizationType);
      if (!adapter) continue;

      try {
        // Get organization UUID
        const organizationUuid = await adapter.getOrganizationUuid(orgData.organizationId);
        if (!organizationUuid) continue;

        // Get organization details and member data in parallel (optimization)
        const [organizationDetails, memberData] = await Promise.all([
          adapter.getOrganizationDetails(organizationUuid),
          adapter.getMemberData(userId, orgData.organizationId),
        ]);

        if (!organizationDetails) continue;

        memberships.push({
          organization: {
            type: orgData.organizationType,
            uuid: organizationDetails.uuid,
            name: organizationDetails.name,
            logoSrc: organizationDetails.logoSrc,
          },
          isAdmin: memberData.isAdmin,
          isOwner: userId === organizationDetails.ownerUuid,
          joinedAt: memberData.createdAt,
          membershipUpdatedAt: memberData.updatedAt,
          roles: orgData.roles,
        });
      } catch (error) {
        // Skip organizations that can't be fetched (e.g., deleted)
        console.error(`Failed to fetch organization ${orgKey}:`, error);
        continue;
      }
    }

    // Sort by organization type and name
    return memberships.sort((a, b) => {
      if (a.organization.type !== b.organization.type) {
        return a.organization.type.localeCompare(b.organization.type);
      }
      return a.organization.name.localeCompare(b.organization.name);
    });
  }
}
