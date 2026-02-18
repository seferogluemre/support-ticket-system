import prisma from '@onlyjs/db';
import { Prisma } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { ForbiddenException, NotFoundException } from '../../utils';
import {
  ensureCompanyPermission,
  getAccessibleCompanyIds,
  getCompanyWithAccessCheck,
  hasCompanyPermission,
} from '../auth/authorization/organizations/helpers/company';
import { PERMISSIONS } from '../auth/authorization/permissions/constants';
import type { ProjectCreatePayload, ProjectIndexQuery, ProjectUpdatePayload } from './types';

export abstract class ProjectsService {
  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Proje bulunamadı');
      }
    }
    console.error(`Error in ProjectsService.${context}:`, error);
    throw error;
  }


  static async index(query: ProjectIndexQuery, userId: string) {
    try {
      const { page = 1, perPage = 20, search, companyUuid, status } = query;
      const skip = (page - 1) * perPage;

      // Get accessible company IDs using helper
      const accessibleCompanyIds = await getAccessibleCompanyIds(
        userId,
        PERMISSIONS.PROJECTS.LIST_ALL.key,
      );

      if (accessibleCompanyIds.length === 0) {
        return { data: [], total: 0 };
      }

      const where: Prisma.ProjectWhereInput = {
        companyId: { in: accessibleCompanyIds },
        deletedAt: null,
      };

      // Filter by company if specified
      if (companyUuid) {
        const company = await prisma.company.findUnique({
          where: { uuid: companyUuid },
          select: { id: true },
        });

        if (!company) {
          throw new NotFoundException('Company bulunamadı');
        }

        // Check if user can access this company
        if (!accessibleCompanyIds.includes(company.id)) {
          throw new ForbiddenException('Bu company\'nin projelerine erişim yetkiniz yok');
        }

        where.companyId = company.id;
      }

      // Filter by status if specified
      if (status) {
        where.status = status as any;
      }

      // Search filter
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                uuid: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string, userId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { uuid, deletedAt: null },
        include: {
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Proje bulunamadı');
      }

      // Check access using helper (throws if no access)
      await getCompanyWithAccessCheck(
        project.company.uuid,
        userId,
        PERMISSIONS.PROJECTS.LIST_ALL.key,
      );

      return project;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async store(data: Omit<ProjectCreatePayload, 'companyUuid'>, userId: string, companyUuid: string) {
    try {
      // Get company and check access + permission
      const company = await getCompanyWithAccessCheck(
        companyUuid,
        userId,
        PERMISSIONS.PROJECTS.LIST_ALL.key,
      );

      // Check CREATE permission (throws if no permission)
      await ensureCompanyPermission(
        userId,
        company.uuid,
        PERMISSIONS.PROJECTS.CREATE.key,
        undefined,
        'Proje oluşturma yetkiniz yok',
      );

      return await prisma.project.create({
        data: {
          ...data,
          companyId: company.id,
          companyUuid: company.uuid,
          createdById: userId,
        },
        include: {
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async update(uuid: string, data: ProjectUpdatePayload, userId: string) {
    try {
      // Get existing project with company info
      const existingProject = await prisma.project.findUnique({
        where: { uuid, deletedAt: null },
        select: {
          id: true,
          companyId: true,
          company: { select: { uuid: true } },
        },
      });

      if (!existingProject) {
        throw new NotFoundException('Proje bulunamadı');
      }

      // Check permissions (global OR company-specific) - throws if no permission
      await ensureCompanyPermission(
        userId,
        existingProject.company.uuid,
        PERMISSIONS.PROJECTS.UPDATE_ALL.key,
        PERMISSIONS.PROJECTS.UPDATE_OWN_COMPANY.key,
        'Proje güncelleme yetkiniz yok',
      );

      const project = await prisma.project.update({
        where: { uuid },
        data,
        include: {
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return project;
    } catch (error) {
      throw this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string, userId: string) {
    try {
      // Get existing project with company info
      const existingProject = await prisma.project.findUnique({
        where: { uuid, deletedAt: null },
        select: {
          id: true,
          companyId: true,
          company: { select: { uuid: true } },
        },
      });

      if (!existingProject) {
        throw new NotFoundException('Proje bulunamadı');
      }

      // Check permissions (global OR company-specific) - throws if no permission
      await ensureCompanyPermission(
        userId,
        existingProject.company.uuid,
        PERMISSIONS.PROJECTS.DELETE_ALL.key,
        PERMISSIONS.PROJECTS.DELETE_OWN_COMPANY.key,
        'Proje silme yetkiniz yok',
      );

      // Soft delete
      const project = await prisma.project.update({
        where: { uuid },
        data: { deletedAt: new Date() },
        include: {
          company: {
            select: {
              id: true,
              uuid: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return project;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }
}