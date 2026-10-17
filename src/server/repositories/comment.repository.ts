import { CommentStatus, CommentTargetType, PostStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toPlainText } from "@/lib/plain-text";
import type { CommentCreateData } from "@/types/comment-create-data";
import type { CommentSubmitResult } from "@/types/comment-submit-result";
import type { CommentTarget } from "@/types/comment-target";
import type { SiteComment } from "@/types/site-comment";
import type { CommentRepository } from "./comment.repository.interface";

// 基于 Prisma 的站内评论仓储实现
export class PrismaCommentRepository implements CommentRepository {
  async findPublishedTarget(
    targetType: CommentTargetType,
    targetId: number | null,
  ): Promise<CommentTarget | null> {
    const now = new Date();
    switch (targetType) {
      case CommentTargetType.POST: {
        if (targetId === null) {
          return null;
        }
        const row = await prisma.post.findFirst({
          where: { id: targetId, status: PostStatus.PUBLISHED },
          select: { title: true },
        });
        return row ? { type: targetType, id: targetId, title: row.title } : null;
      }
      case CommentTargetType.GALLERY_ALBUM: {
        if (targetId === null) {
          return null;
        }
        const row = await prisma.galleryAlbum.findFirst({
          where: { id: targetId, enabled: true },
          select: { title: true },
        });
        return row ? { type: targetType, id: targetId, title: row.title } : null;
      }
      case CommentTargetType.PROJECT: {
        if (targetId === null) {
          return null;
        }
        const row = await prisma.project.findFirst({
          where: { id: targetId, enabled: true, publishedAt: { lte: now } },
          select: { title: true },
        });
        return row ? { type: targetType, id: targetId, title: row.title } : null;
      }
      case CommentTargetType.PAGE: {
        if (targetId === null) {
          return null;
        }
        const row = await prisma.page.findFirst({
          where: { id: targetId, published: true },
          select: { title: true },
        });
        return row ? { type: targetType, id: targetId, title: row.title } : null;
      }
      case CommentTargetType.DYNAMIC: {
        if (targetId === null) {
          return null;
        }
        const row = await prisma.dynamic.findFirst({
          where: { id: targetId, publishedAt: { lte: now } },
          select: { content: true },
        });
        return row
          ? { type: targetType, id: targetId, title: toPlainText(row.content, 60) || "动态" }
          : null;
      }
      case CommentTargetType.GUESTBOOK:
        return { type: targetType, id: null, title: "留言" };
      case CommentTargetType.SPONSOR:
        return { type: targetType, id: null, title: "打赏" };
      case CommentTargetType.FRIENDS:
        return { type: targetType, id: null, title: "友链" };
      default:
        return null;
    }
  }

  async findApprovedPage(
    targetType: CommentTargetType,
    targetId: number | null,
    page: number,
    pageSize: number,
  ): Promise<{ items: SiteComment[]; total: number }> {
    const where = {
      targetType,
      targetId,
      status: CommentStatus.APPROVED,
    };
    const [rows, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          authorName: true,
          authorWebsite: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.comment.count({ where }),
    ]);
    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        authorName: row.authorName,
        authorWebsite: row.authorWebsite ?? "",
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async create(input: CommentCreateData): Promise<CommentSubmitResult> {
    const row = await prisma.comment.create({
      data: {
        targetType: input.targetType,
        targetId: input.targetId,
        targetTitle: input.targetTitle,
        authorName: input.authorName,
        authorEmail: input.authorEmail || null,
        authorWebsite: input.authorWebsite || null,
        content: input.content,
        status: input.status,
      },
      select: { id: true, status: true },
    });
    return row;
  }
}
