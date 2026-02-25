import prisma from "@onlyjs/db";
import { Prisma } from "@onlyjs/db/client";
import { PrismaClientKnownRequestError } from "@onlyjs/db/client/runtime/library";
import { NotFoundException } from "../../utils";
import type { PaginationQuery } from "../../utils/pagination";
import type { TagCreatePayload, TagUpdatePayload } from "./types";

export abstract class TagsService {
  private static async handlePrismaError(
    error: unknown,
    context: "find" | "create" | "update" | "delete",
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundException("Etiket bulunamadı");
      }
    }
    console.error(`Error in TagsService.${context}:`, error);
    throw error;
  }

  static async index(
    query: PaginationQuery & { search?: string; companyUuid?: string },
  ) {
    try {
      const { page = 1, perPage = 20, search, companyUuid } = query;
      const skip = (page - 1) * perPage;

      const where: Prisma.TagWhereInput = {
        deletedAt: null,
        ...(companyUuid && { companyUuid }),
        ...(search && {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.tag.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
        }),
        prisma.tag.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, "find");
    }
  }

  static async show(uuid: string) {
    try {
      const tag = await prisma.tag.findUnique({
        where: { uuid, deletedAt: null },
      });

      if (!tag) {
        throw new NotFoundException("Etiket bulunamadı");
      }

      return tag;
    } catch (error) {
      throw this.handlePrismaError(error, "find");
    }
  }

  static async store(data: TagCreatePayload) {
    try {
      // companyUuid'den companyId'yi resolve et (Ticket ile aynı pattern)
      const company = await prisma.company.findUnique({
        where: { uuid: data.companyUuid, deletedAt: null },
        select: { id: true, uuid: true },
      });

      if (!company) {
        throw new NotFoundException("Company bulunamadı");
      }

      return await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color,
          companyId: company.id,
          companyUuid: company.uuid,
        },
      });
    } catch (error) {
      throw this.handlePrismaError(error, "create");
    }
  }

  static async update(
    uuid: string,
    companyUuid: string,
    data: TagUpdatePayload,
  ) {
    try {
      // companyUuid'yi data'dan çıkar -- sadece yetki doğrulaması için geldi, güncellenmez
      const { companyUuid: _companyUuid, ...updateData } =
        data as TagUpdatePayload & { companyUuid: string };

      const tag = await prisma.tag.update({
        where: { uuid, companyUuid, deletedAt: null },
        data: updateData,
      });

      if (!tag) {
        throw new NotFoundException("Etiket bulunamıyor");
      }

      return tag;
    } catch (error) {
      throw this.handlePrismaError(error, "update");
    }
  }

  static async destroy(uuid: string, companyUuid: string) {
    try {
      const tag = await prisma.tag.update({
        where: { uuid, companyUuid, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (!tag) {
        throw new NotFoundException("Etiket bulunamıyor");
      }

      return tag;
    } catch (error) {
      throw this.handlePrismaError(error, "delete");
    }
  }
}
