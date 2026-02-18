import { FileLibraryAssetsService } from '#modules/file-library-assets';
import prisma from '@onlyjs/db';
import { type Gender, Prisma, type User } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { FileLibraryAssetType, type OrganizationType, UserScope } from '@onlyjs/db/enums';
import { UserWhereUnique } from '@onlyjs/db/prismabox/User';
import { ConflictException, ForbiddenException, InternalServerErrorException, NotFoundException } from '../../utils';
import { betterAuth } from '../auth/authentication/instance';
import { organizationRegistry } from '../auth/authorization/organizations';
import { getUserFilters } from './dtos';
import type { UserCreatePayload, UserIndexQuery, UserUpdatePayload } from './types';
import { UserRolesService } from './user-roles';

enum RecordStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  ALL = 'ALL',
}

enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ALL = 'ALL',
}


interface UserPayload {
  name?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  gender?: Gender;
  scope?: UserScope;
}

export abstract class UsersService {
  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      if (error.code === 'P2002' && context === 'create') {
        throw new ConflictException('Kullanıcı adı zaten alınmış');
      }
    }
    throw error;
  }

  private static async prepareUserPayload(payloadRaw: UserUpdatePayload | UserCreatePayload): Promise<UserPayload> {
    const email = payloadRaw.email?.toLowerCase();

    const { firstName, lastName, isActive, gender } = payloadRaw;
    const scope = 'scope' in payloadRaw ? payloadRaw.scope : undefined;

    const name = firstName && lastName ? `${firstName} ${lastName}` : undefined;

    const userPayload = { name, email, firstName, lastName, isActive, gender, scope };

    return Object.fromEntries(
      Object.entries(userPayload).filter(([_, value]) => value !== undefined),
    ) as UserPayload;
  }

  static async index(
    query?: UserIndexQuery & {
      roleUuids?: string[];
      organizationType?: OrganizationType;
      organizationId?: number;
      search?: string;
      page?: number;
      perPage?: number;
    },
    currentUser?: User,
  ): Promise<{ data: User[]; total: number }> {
    const filterQuery = query
      ? {
          ...query,
          email: query.email === null ? undefined : query.email,
        }
      : undefined;

    const [hasFilters, filters] = getUserFilters(filterQuery);
    const where: Prisma.UserWhereInput = {};

    if (hasFilters) {
      where.OR = filters;
    }

    if (query?.recordStatus === RecordStatus.DELETED) {
      where.deletedAt = { not: null };
    } else if (query?.recordStatus === RecordStatus.ALL) {
      // Do nothing
    } else {
      where.deletedAt = null;
    }

    if (query?.status === Status.ACTIVE) {
      where.isActive = true;
    } else if (query?.status === Status.INACTIVE) {
      where.isActive = false;
    }

    // Search filter
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    // Role filtresi
    if (query?.roleUuids && query.roleUuids.length > 0) {
      where.userRoles = {
        some: {
          role: {
            uuid: {
              in: query.roleUuids,
            },
          },
        },
      };
    }

    // Organization filtresi
    if (query?.organizationType && query?.organizationId && currentUser) {
      const adapter = organizationRegistry.get(query.organizationType);
      if (adapter) {
        // Eğer kullanıcı bu organizasyona üye değilse, sadece o organizasyondaki kullanıcıları göster
        const isCurrentUserMember = await adapter.isMember(currentUser.id, query.organizationId);
        if (!isCurrentUserMember) {
          // Sadece bu organizasyondaki kullanıcıları göster
          where.userRoles = {
            some: {
              organizationType: query.organizationType,
              organizationId: query.organizationId,
            },
          };
        }
        // Eğer kullanıcı bu organizasyona üyeyse, tüm kullanıcıları görebilir (global permission varsa)
      }
    } else if (query?.organizationType && query?.organizationId) {
      // Eğer currentUser yoksa, sadece bu organizasyondaki kullanıcıları göster
      where.userRoles = {
        some: {
          organizationType: query.organizationType,
          organizationId: query.organizationId,
        },
      };
    }

    // Pagination
    const page = query?.page || 1;
    const perPage = query?.perPage || 20;
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: perPage,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  uuid: true,
                  name: true,
                  type: true,
                  organizationType: true,
                  organizationUuid: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  static async show(
    where: typeof UserWhereUnique.static,
    recordStatus?: keyof typeof RecordStatus,
    status?: keyof typeof Status,
  ) {
    let deletedFilter: { deletedAt: Prisma.UserWhereUniqueInput['deletedAt'] } | null = {
      deletedAt: null,
    }; // Varsayılan olarak aktif kayıtlar
    if (recordStatus === RecordStatus.DELETED) {
      deletedFilter = { deletedAt: { not: null } }; // Sadece silinmiş kayıtlar
    } else if (recordStatus === RecordStatus.ALL) {
      deletedFilter = null; // Tüm kayıtlar
    }

    let activeFilter: { isActive: boolean } | null = null;
    if (status === Status.ACTIVE) {
      activeFilter = { isActive: true };
    } else if (status === Status.INACTIVE) {
      activeFilter = { isActive: false };
    }

    const user = await prisma.user.findFirst({
      where: {
        ...(where as Prisma.UserWhereInput),
        ...(deletedFilter || {}),
        ...(activeFilter || {}),
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                uuid: true,
                name: true,
                type: true,
                organizationType: true,
                organizationUuid: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return user;
  }

  /**
   * 🔄 Restore a soft-deleted user
   * @private
   */
  private static async restoreSoftDeletedUser(
    userId: string,
    payload: UserCreatePayload,
    userPayload: Prisma.UserUpdateInput,
    client: Prisma.TransactionClient | typeof prisma,
    skipRoleValidation: boolean,
  ): Promise<User> {
    // Restore user data
    await client.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        ...userPayload,
      },
    });

    // ⚠️ Note: Password cannot be updated via better-auth for soft-deleted users
    // The user will need to use "forgot password" flow to reset their password

    // Update roles
    await UserRolesService.update(
      userId,
      payload.roleUuids,
      { id: userId },
      client,
      null,
      skipRoleValidation,
    );

    // Handle image upload if provided
    if (payload.imageFile) {
      const fileLibraryAsset = await FileLibraryAssetsService.store({
        file: payload.imageFile,
        type: FileLibraryAssetType.USER_IMAGE,
      });

      await client.user.update({
        where: { id: userId },
        data: {
          imageAsset: { connect: { id: fileLibraryAsset.id } },
          image: fileLibraryAsset.path,
        },
      });
    }

    return (await client.user.findUnique({ where: { id: userId } })) as User;
  }

  /**
   * 🆕 Create a new user
   * @private
   */
  private static async createNewUser(
    payload: UserCreatePayload,
    userPayload: Prisma.UserUpdateInput,
    client: Prisma.TransactionClient | typeof prisma,
    skipRoleValidation: boolean,
  ): Promise<User> {
    // Create user via betterAuth
    const signInResponse = await betterAuth.api.signUpEmail({
      body: {
        name: (userPayload.name as string) || '',
        email: (userPayload.email as string) || payload.email,
        password: payload.password,
        firstName: (userPayload.firstName as string) || payload.firstName,
        lastName: (userPayload.lastName as string) || payload.lastName,
        image: userPayload.image as string | undefined,
      },
    });

    const userId = signInResponse.user.id;

    // Update scope if provided
    if (userPayload.scope) {
      await client.user.update({
        where: { id: userId },
        data: { scope: userPayload.scope },
      });
    }

    // Assign roles (or default 'user' role if empty)
    await UserRolesService.update(
      userId,
      payload.roleUuids,
      { id: userId },
      client,
      null,
      skipRoleValidation,
    );

    // Handle image upload if provided
    const updates: Prisma.UserUpdateInput = {};
    if (payload.imageFile) {
      const fileLibraryAsset = await FileLibraryAssetsService.store({
        file: payload.imageFile,
        type: FileLibraryAssetType.USER_IMAGE,
      });

      updates.imageAsset = { connect: { id: fileLibraryAsset.id } };
      updates.image = fileLibraryAsset.path;
    }

    // Update user with image if provided
    if (Object.keys(updates).length > 0) {
      return await client.user.update({
        where: { id: userId },
        data: updates,
      });
    }

    return (await client.user.findUnique({ where: { id: userId } })) as User;
  }

  static async store(
    payload: UserCreatePayload,
    tx?: Prisma.TransactionClient,
    skipRoleValidation = false,
    currentUser?: User
  ): Promise<User> {
    try {
      const client = tx || prisma;
      
      // 🔒 SECURITY: Validate scope assignment
      if (payload.scope === UserScope.SYSTEM && !skipRoleValidation) {
        // Only SYSTEM scope users can create other SYSTEM scope users
        if (!currentUser || currentUser.scope !== UserScope.SYSTEM) {
          throw new ForbiddenException('Sadece sistem yöneticileri sistem seviyesinde kullanıcı oluşturabilir');
        }
      }
      
      const userPayload = await this.prepareUserPayload(payload);

      // 🔄 FLOW 1: RESTORE soft-deleted user if exists
      const existingUser = await client.user.findUnique({
        where: { email: payload.email },
        select: { id: true, deletedAt: true },
      });

      if (existingUser?.deletedAt) {
        return await this.restoreSoftDeletedUser(existingUser.id, payload, userPayload, client, skipRoleValidation);
      }

      // 🆕 FLOW 2: CREATE new user
      return await this.createNewUser(payload, userPayload, client, skipRoleValidation);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
        }
      }
      throw error;
    }
  }

  static async update(id: string, payload: UserUpdatePayload, currentUser?: User): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { imageAsset: true },
      });

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }
      
      // 🔒 SECURITY: Validate scope change
      if ('scope' in payload && payload.scope !== undefined) {
        // Prevent changing scope to SYSTEM unless current user is SYSTEM
        if (payload.scope === UserScope.SYSTEM && currentUser?.scope !== UserScope.SYSTEM) {
          throw new ForbiddenException('Sadece sistem yöneticileri kullanıcıyı sistem seviyesine yükseltebilir');
        }
        
        // Prevent downgrading SYSTEM users unless current user is SYSTEM
        if (user.scope === UserScope.SYSTEM && payload.scope !== UserScope.SYSTEM && currentUser?.scope !== UserScope.SYSTEM) {
          throw new ForbiddenException('Sadece sistem yöneticileri sistem seviyesindeki kullanıcıları düşürebilir');
        }
      }

      const userPayload = await this.prepareUserPayload(payload);

      const updates: Prisma.UserUpdateInput = { ...userPayload };

      const file = payload.imageFile;
      if (file !== undefined) {
        if (user.imageAsset) {
          await FileLibraryAssetsService.destroy(user.imageAsset.uuid);
        }

        if (file !== null) {
          const fileLibraryAsset = await FileLibraryAssetsService.store({
            file,
            type: FileLibraryAssetType.USER_IMAGE,
          });

          updates.imageAsset = { connect: { id: fileLibraryAsset.id } };
          updates.image = fileLibraryAsset.path;
        } else {
          updates.imageAsset = { disconnect: true };
          updates.image = null;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updates,
      });

      if (!updatedUser) {
        throw new InternalServerErrorException('Bilinmeyen bir hata oluştu');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Bu kullanıcı adı veya email zaten kullanılıyor');
        }
      }
      throw error;
    }
  }

  static async destroy(id: string): Promise<void> {
    try {
      await betterAuth.api.removeUser({
        body: {
          userId: id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Kullanıcı bulunamadı');
        }
      }
      throw error;
    }
  }

  static async restore(id: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { id, deletedAt: { not: null } },
      });

      if (!user) {
        throw new NotFoundException('Kullanıcı bulunamadı veya zaten aktif');
      }

      return await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
    } catch (error) {
      await this.handlePrismaError(error, 'update');
      throw error;
    }
  }
}
