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
      throw await this.handlePrismaError(error, "find");
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
      throw await this.handlePrismaError(error, "find");
    }
  }

  static async store(data: TagCreatePayload) {
    try {
      return await prisma.tag.create({
        data,
      });
    } catch (error) {
      throw await this.handlePrismaError(error, "create");
    }
  }

  static async update(uuid: string, data: TagUpdatePayload) {
    try {
      const tag = await prisma.tag.update({
        where: { uuid, deletedAt: null },
        data,
      });

      if (!tag) {
        throw new NotFoundException("Etiket bulunamadı");
      }

      return tag;
    } catch (error) {
      throw await this.handlePrismaError(error, "update");
    }
  }

  static async destroy(uuid: string) {
    try {
      const tag = await prisma.tag.delete({
        where: { uuid },
      });

      if (!tag) {
        throw new NotFoundException("Etiket bulunamadı");
      }

      return tag;
    } catch (error) {
      throw await this.handlePrismaError(error, "delete");
    }
  }
}
