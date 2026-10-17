import { CommentStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminCommentItem } from "@/types/admin-comment-item";
import type { AdminCommentListParams } from "@/types/admin-comment-list-params";
import type { AdminCommentPage } from "@/types/admin-comment-page";
import type { CommentStatusCounts } from "@/types/comment-status-counts";
import type { AdminCommentRepository } from "./admin-comment.repository.interface";

// 后台评论查询字段
const adminCommentSelect = {
  id: true,
  targetType: true,
  targetId: true,
  targetTitle: true,
  authorName: true,
  authorEmail: true,
  authorWebsite: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CommentSelect;

// Prisma 日期字段转换为接口使用的 ISO 字符串
function toAdminCommentItem(row: {
  id: number;
  targetType: AdminCommentItem["targetType"];
  targetId: number | null;
  targetTitle: string;
  authorName: string;
  authorEmail: string | null;
  authorWebsite: string | null;
  content: string;
  status: AdminCommentItem["status"];
  createdAt: Date;
  updatedAt: Date;
}): AdminCommentItem {
  return {
    ...row,
    authorEmail: row.authorEmail ?? "",
    authorWebsite: row.authorWebsite ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// 基于 Prisma 的后台评论仓储实现
export class PrismaAdminCommentRepository implements AdminCommentRepository {
  async findPage(params: AdminCommentListParams): Promise<AdminCommentPage> {
    const where: Prisma.CommentWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.targetType ? { targetType: params.targetType } : {}),
      ...(params.keyword
        ? {
            OR: [
              { targetTitle: { contains: params.keyword } },
              { authorName: { contains: params.keyword } },
              { authorEmail: { contains: params.keyword } },
              { content: { contains: params.keyword } },
            ],
          }
        : {}),
    };
    const [rows, total, counts] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: adminCommentSelect,
      }),
      prisma.comment.count({ where }),
      this.countStatus(),
    ]);
    return {
      items: rows.map(toAdminCommentItem),
      total,
      page: params.page,
      pageSize: params.pageSize,
      counts,
    };
  }

  async findById(id: number): Promise<AdminCommentItem | null> {
    const row = await prisma.comment.findUnique({ where: { id }, select: adminCommentSelect });
    return row ? toAdminCommentItem(row) : null;
  }

  async updateStatus(id: number, status: CommentStatus): Promise<void> {
    await prisma.comment.update({ where: { id }, data: { status } });
  }

  async remove(id: number): Promise<void> {
    await prisma.comment.delete({ where: { id } });
  }

  async countStatus(): Promise<CommentStatusCounts> {
    const groups = await prisma.comment.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const counts: CommentStatusCounts = { total: 0, pending: 0, approved: 0, hidden: 0 };
    for (const group of groups) {
      counts.total += group._count._all;
      if (group.status === CommentStatus.PENDING) {
        counts.pending = group._count._all;
      } else if (group.status === CommentStatus.APPROVED) {
        counts.approved = group._count._all;
      } else if (group.status === CommentStatus.HIDDEN) {
        counts.hidden = group._count._all;
      }
    }
    return counts;
  }
}
