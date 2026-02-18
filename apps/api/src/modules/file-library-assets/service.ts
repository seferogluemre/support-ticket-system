import prisma from '@onlyjs/db';
import { FileLibraryAssetFileType, FileLibraryAssetType, Prisma } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import { getStoragePath } from '../../core';
import { NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { FILE_LIBRARY_ASSET_TYPE_RULES, normalizeMimeType } from './constants';
import { getFileLibraryAssetFilters } from './dtos';
import type {
  FileLibraryAssetIndexQuery,
  FileLibraryAssetUpdateInput,
} from './types';

/**
 * Input for storing a file to the file system
 */
export interface StoreToFileSystemInput {
  /** File buffer to store */
  buffer: Buffer;
  /** Path prefix segments (e.g., ['products', 'images']) */
  pathPrefix: string[];
  /** Original filename (optional - will generate unique name if not provided) */
  filename?: string;
  /** File extension (required if filename not provided) */
  extension?: string;
}

/**
 * Result of storing a file to the file system
 */
export interface StoreToFileSystemResult {
  /** Relative path to the stored file (e.g., products/images/abc123.png) */
  relativePath: string;
  /** Generated unique filename */
  filename: string;
  /** File size in bytes */
  size: number;
}

/**
 * Input for storing a file from File object (form upload)
 */
export interface FileStoreInput {
  /** File object from form upload */
  file: File;
  /** Asset type */
  type: FileLibraryAssetType;
  /** Company UUID (optional) */
  companyUuid?: string;
  /** Asset title (optional) */
  title?: string;
  /** Additional metadata (optional) */
  metadata?: unknown;
}

/**
 * Input for storing a file from buffer
 */
export interface BufferStoreInput {
  /** File buffer to store */
  buffer: Buffer;
  /** MIME type of the file */
  mimeType: string;
  /** Asset type */
  type: FileLibraryAssetType;
  /** Original filename (optional) */
  filename?: string;
  /** File extension (required if filename not provided) */
  extension?: string;
  /** Additional path segments to append to pathPrefix */
  additionalPathSegments?: string[];
  /** Company UUID (optional) */
  companyUuid?: string;
  /** Asset title (optional) */
  title?: string;
  /** Additional metadata (optional) */
  metadata?: unknown;
}

/**
 * Union type for store input - supports both File and Buffer
 */
export type StoreInput = FileStoreInput | BufferStoreInput;

export abstract class FileLibraryAssetsService {
  /**
   * Store a file buffer to the file system
   * This is a low-level utility method that can be used by other services
   * @param input - File storage input parameters
   * @returns Storage result with relative path and metadata
   */
  static async storeToFileSystem(input: StoreToFileSystemInput): Promise<StoreToFileSystemResult> {
    const { buffer, pathPrefix, filename: originalFilename, extension } = input;

    // Generate unique filename
    const uniqueId = nanoid();
    let filename: string;

    if (originalFilename) {
      // Sanitize original filename and prepend unique ID
      const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      filename = `${uniqueId}-${sanitizedName}`;
    } else if (extension) {
      filename = `${uniqueId}.${extension}`;
    } else {
      filename = `${uniqueId}.bin`;
    }

    // Create directory structure
    const uploadDir = getStoragePath(pathPrefix.join('/'));

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file to disk
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Generate relative path
    const relativePath = path.posix.join(pathPrefix.join('/'), filename);

    return {
      relativePath,
      filename,
      size: buffer.length,
    };
  }

  /**
   * Get FileType from MIME type
   */
  private static getFileTypeFromMimeType(mimeType: string): FileLibraryAssetFileType {
    if (mimeType.startsWith('image/')) {
      return FileLibraryAssetFileType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return FileLibraryAssetFileType.VIDEO;
    }
    return FileLibraryAssetFileType.DOCUMENT;
  }

  /**
   * Type guard to check if input is buffer-based
   */
  private static isBufferInput(input: StoreInput): input is BufferStoreInput {
    return 'buffer' in input;
  }

  private static async handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Dosya bulunamadı');
      }
    }
    console.error(`Error in FileLibraryAssetsService.${context}:`, error);
    throw error;
  }

  static async index(query: FileLibraryAssetIndexQuery) {
    try {
      const [hasFilters, filters, orderBy] = getFileLibraryAssetFilters(query);
      const { skip, perPage } = PaginationService.getPaginationParams(query);

      const where = hasFilters
        ? {
            AND: [...filters],
          }
        : { deletedAt: null };

      const [data, total] = await Promise.all([
        prisma.fileLibraryAsset.findMany({
          where,
          skip,
          take: perPage,
          orderBy,
        }),
        prisma.fileLibraryAsset.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async indexFlat(query: FileLibraryAssetIndexQuery) {
    try {
      const [hasFilters, filters, orderBy] = getFileLibraryAssetFilters(query);

      const where = hasFilters
        ? {
            AND: [...filters, { companyUuid: query.companyUuid || null }],
          }
        : { deletedAt: null, companyUuid: query.companyUuid || null };

      const data = await prisma.fileLibraryAsset.findMany({
        where,
        orderBy,
      });

      return data;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string) {
    try {
      const fileLibraryAsset = await prisma.fileLibraryAsset.findUnique({
        where: { uuid },
      });

      if (!fileLibraryAsset) {
        throw new NotFoundException('Dosya bulunamadı');
      }

      return fileLibraryAsset;
    } catch (error) {
      throw this.handlePrismaError(error, 'find');
    }
  }

  /**
   * Store a file and create a FileLibraryAsset record
   * Supports both File object (form upload) and Buffer (programmatic)
   * @param data - Store input (FileStoreInput or BufferStoreInput)
   * @param tx - Optional Prisma transaction client
   * @returns Created FileLibraryAsset record
   */
  static async store(data: StoreInput, tx?: Prisma.TransactionClient) {
    try {
      const { type, companyUuid, title, metadata } = data;

      const validationRules = FILE_LIBRARY_ASSET_TYPE_RULES[type];
      const { allowedMimeTypes, maxSize } = validationRules.validationRules;
      const { pathPrefix } = validationRules;

      let buffer: Buffer;
      let mimeType: string;
      let extension: string | undefined;
      let fullPathPrefix: string[];

      if (this.isBufferInput(data)) {
        // Buffer-based input
        buffer = data.buffer;
        mimeType = data.mimeType;
        extension = data.extension || data.filename?.split('.').pop();
        fullPathPrefix = data.additionalPathSegments
          ? [...pathPrefix, ...data.additionalPathSegments]
          : pathPrefix;
      } else {
        // File-based input
        buffer = Buffer.from(await data.file.arrayBuffer());
        mimeType = data.file.type;
        extension = data.file.name.split('.').pop();
        fullPathPrefix = pathPrefix;
      }

      // Validate file size
      if (buffer.length > maxSize) {
        throw new Error('Dosya boyutu maksimum dosya boyutundan büyük olamaz.');
      }

      // Validate MIME type
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error(`Desteklenmeyen dosya türü: ${mimeType}`);
      }

      // Store file to file system
      const storedFile = await this.storeToFileSystem({
        buffer,
        pathPrefix: fullPathPrefix,
        filename: this.isBufferInput(data) ? data.filename : undefined,
        extension,
      });

      // Get companyId from companyUuid if provided
      let companyId: number | undefined = undefined;
      if (companyUuid) {
        const company = await prisma.company.findUnique({
          where: { uuid: companyUuid },
          select: { id: true },
        });
        if (company) {
          companyId = company.id;
        }
      }

      // Determine file type from MIME type
      const fileType = this.getFileTypeFromMimeType(mimeType);

      const dbClient = tx || prisma;

      const fileLibraryAsset = await dbClient.fileLibraryAsset.create({
        data: {
          title,
          name: storedFile.filename,
          type,
          fileType,
          mimeType: normalizeMimeType(mimeType),
          path: storedFile.relativePath,
          size: storedFile.size,
          metadata: metadata || undefined,
          companyUuid,
          companyId,
        },
      });

      return fileLibraryAsset;
    } catch (error) {
      throw this.handlePrismaError(error, 'create');
    }
  }

  static async update(
    uuid: string,
    data: FileLibraryAssetUpdateInput & { metadata?: unknown },
    tx?: Prisma.TransactionClient,
  ) {
    try {
      const dbClient = tx || prisma;

      const existingFileLibraryAsset = await dbClient.fileLibraryAsset.findUnique({
        where: { uuid },
        select: {
          id: true,
        },
      });

      if (!existingFileLibraryAsset) {
        throw new NotFoundException('Dosya bulunamadı.');
      }

      const updates: Prisma.FileLibraryAssetUpdateInput = {
        name: data.name,
        metadata: data.metadata !== undefined ? data.metadata : undefined,
      };

      const fileLibraryAsset = await dbClient.fileLibraryAsset.update({
        where: { uuid },
        data: updates,
      });

      return fileLibraryAsset;
    } catch (error) {
      throw this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string) {
    try {
      const fileLibraryAsset = await prisma.fileLibraryAsset.findUnique({
        where: { uuid },
      });

      if (!fileLibraryAsset) {
        throw new NotFoundException('Dosya bulunamadı');
      }

      const filePath = getStoragePath(fileLibraryAsset.path);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deletedAsset = await prisma.fileLibraryAsset.delete({
        where: { uuid },
      });

      return deletedAsset;
    } catch (error) {
      throw this.handlePrismaError(error, 'delete');
    }
  }
}
