import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/string-array";
import type { AdminGalleryAlbum } from "@/types/admin-gallery-album";
import type { GalleryAlbumWriteInput } from "@/types/gallery-album-write-input";
import type { AdminGalleryRepository } from "./admin-gallery.repository.interface";

// 照片排序：权重倒序，权重相同时按编号正序，和前台保持一致
const photoOrderBy: Prisma.GalleryPhotoOrderByWithRelationInput[] = [{ sortOrder: "desc" }, { id: "asc" }];

// 后台查询字段：密码只返回「是否已设置」，不把哈希发到浏览器
const adminGallerySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverUrl: true,
  eventDate: true,
  location: true,
  tags: true,
  passwordHash: true,
  passwordHint: true,
  sortOrder: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
  photos: {
    select: { id: true, imageUrl: true, caption: true, sortOrder: true },
    orderBy: photoOrderBy,
  },
} as const;

type AdminGalleryRow = Prisma.GalleryAlbumGetPayload<{ select: typeof adminGallerySelect }>;

// 数据库行转换为后台相册
function toAdminAlbum(row: AdminGalleryRow): AdminGalleryAlbum {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.coverUrl,
    eventDate: row.eventDate,
    location: row.location,
    tags: toStringArray(row.tags),
    passwordConfigured: Boolean(row.passwordHash),
    passwordHint: row.passwordHint,
    sortOrder: row.sortOrder,
    enabled: row.enabled,
    photos: row.photos,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// 相册基础字段转换
function toBaseData(input: GalleryAlbumWriteInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    coverUrl: input.coverUrl,
    eventDate: input.eventDate,
    location: input.location,
    tags: input.tags as unknown as Prisma.InputJsonValue,
    passwordHint: input.passwordHint,
    sortOrder: input.sortOrder,
    enabled: input.enabled,
  };
}

// 照片嵌套写入数据
function toPhotoData(input: GalleryAlbumWriteInput) {
  return input.photos.map((photo) => ({
    imageUrl: photo.imageUrl,
    caption: photo.caption,
    sortOrder: photo.sortOrder,
  }));
}

// 基于 Prisma 的相册后台仓储实现
export class PrismaAdminGalleryRepository implements AdminGalleryRepository {
  async listAll(): Promise<AdminGalleryAlbum[]> {
    const rows = await prisma.galleryAlbum.findMany({
      orderBy: [{ sortOrder: "desc" }, { eventDate: "desc" }, { id: "asc" }],
      select: adminGallerySelect,
    });
    return rows.map(toAdminAlbum);
  }

  async findById(id: number): Promise<AdminGalleryAlbum | null> {
    const row = await prisma.galleryAlbum.findUnique({ where: { id }, select: adminGallerySelect });
    return row ? toAdminAlbum(row) : null;
  }

  async findBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.galleryAlbum.findUnique({ where: { slug }, select: { id: true } });
  }

  async create(input: GalleryAlbumWriteInput): Promise<{ id: number }> {
    return prisma.galleryAlbum.create({
      data: {
        ...toBaseData(input),
        passwordHash: input.passwordHash ?? null,
        photos: { create: toPhotoData(input) },
      },
      select: { id: true },
    });
  }

  async update(id: number, input: GalleryAlbumWriteInput): Promise<void> {
    await prisma.galleryAlbum.update({
      where: { id },
      data: {
        ...toBaseData(input),
        ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
        photos: { deleteMany: {}, create: toPhotoData(input) },
      },
    });
  }

  async remove(id: number): Promise<void> {
    await prisma.galleryAlbum.delete({ where: { id } });
  }
}
