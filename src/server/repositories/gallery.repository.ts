import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/string-array";
import type { GalleryAlbum } from "@/types/gallery-album";
import type { GalleryAlbumAccess } from "@/types/gallery-album-access";
import type { GalleryAlbumDetail } from "@/types/gallery-album-detail";
import type { GalleryRepository } from "./gallery.repository.interface";

// 照片排序：权重倒序，权重相同时按编号正序，保证瀑布流顺序稳定
const photoOrderBy: Prisma.GalleryPhotoOrderByWithRelationInput[] = [{ sortOrder: "desc" }, { id: "asc" }];

// 列表查询：只带首张照片用于封面兜底，避免拉取相册内全部图片
const listSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverUrl: true,
  eventDate: true,
  location: true,
  tags: true,
  passwordHash: true,
  _count: { select: { photos: true } },
  photos: {
    select: { imageUrl: true },
    orderBy: photoOrderBy,
    take: 1,
  },
} as const;

// 详情查询：返回按排序展示的全部照片
const detailSelect = {
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
  _count: { select: { photos: true } },
  photos: {
    select: { id: true, imageUrl: true, caption: true, sortOrder: true },
    orderBy: photoOrderBy,
  },
} as const;

type GalleryListRow = Prisma.GalleryAlbumGetPayload<{ select: typeof listSelect }>;
type GalleryDetailRow = Prisma.GalleryAlbumGetPayload<{ select: typeof detailSelect }>;

// 列表行转换为前台相册卡片
function toAlbum(row: GalleryListRow): GalleryAlbum {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.coverUrl || row.photos[0]?.imageUrl || "",
    eventDate: row.eventDate,
    location: row.location,
    tags: toStringArray(row.tags),
    encrypted: Boolean(row.passwordHash),
    photoCount: row._count.photos,
  };
}

// 详情行转换为前台相册详情
function toAlbumDetail(row: GalleryDetailRow): GalleryAlbumDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.coverUrl || row.photos[0]?.imageUrl || "",
    eventDate: row.eventDate,
    location: row.location,
    tags: toStringArray(row.tags),
    encrypted: Boolean(row.passwordHash),
    photoCount: row._count.photos,
    passwordHint: row.passwordHint,
    photos: row.photos,
  };
}

// 基于 Prisma 的相册前台仓储实现
export class PrismaGalleryRepository implements GalleryRepository {
  async listEnabled(): Promise<GalleryAlbum[]> {
    const rows = await prisma.galleryAlbum.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "desc" }, { eventDate: "desc" }, { id: "asc" }],
      select: listSelect,
    });
    return rows.map(toAlbum);
  }

  async findEnabledAccessBySlug(slug: string): Promise<GalleryAlbumAccess | null> {
    const row = await prisma.galleryAlbum.findFirst({
      where: { slug, enabled: true },
      select: { id: true, passwordHash: true },
    });
    return row ? { id: row.id, encrypted: Boolean(row.passwordHash), passwordHash: row.passwordHash } : null;
  }

  async findEnabledBySlug(slug: string): Promise<GalleryAlbumDetail | null> {
    const row = await prisma.galleryAlbum.findFirst({
      where: { slug, enabled: true },
      select: detailSelect,
    });
    return row ? toAlbumDetail(row) : null;
  }

  async findEnabledPasswordHash(id: number): Promise<{ slug: string; passwordHash: string } | null> {
    const row = await prisma.galleryAlbum.findFirst({
      where: { id, enabled: true, passwordHash: { not: null } },
      select: { slug: true, passwordHash: true },
    });
    return row?.passwordHash ? { slug: row.slug, passwordHash: row.passwordHash } : null;
  }
}
