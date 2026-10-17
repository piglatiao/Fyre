import type { PostStatus } from "@/generated/prisma/client";
import type { AdminPostDetail } from "@/types/admin-post-detail";
import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { PostWriteInput } from "@/types/post-write-input";

// 后台文章仓储接口：文章增删改查与统计
export interface AdminPostRepository {
  // 分页查询（可按状态与关键词过滤）
  findPage(params: {
    page: number;
    pageSize: number;
    status?: PostStatus;
    keyword?: string;
  }): Promise<{ items: AdminPostListItem[]; total: number }>;
  // 按 id 查询编辑所需详情
  findById(id: number): Promise<AdminPostDetail | null>;
  // 读取密码哈希：仅在服务层判断“保留原密码”时使用
  getPasswordHash(id: number): Promise<string | null>;
  // 新建文章（含标签关联），返回新 id
  create(input: PostWriteInput): Promise<{ id: number }>;
  // 更新文章（含标签关联替换）
  update(id: number, input: PostWriteInput): Promise<void>;
  // 批量删除，返回删除数量
  deleteMany(ids: number[]): Promise<number>;
  // slug 是否已存在（编辑时排除自身）
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
  // 按状态统计数量
  countByStatus(): Promise<Record<PostStatus, number>>;
  // 阅读总数
  sumViews(): Promise<number>;
  // 最近更新的文章（仪表盘用）
  listRecent(limit: number): Promise<AdminPostListItem[]>;
  // 按阅读量排行（仪表盘热门文章）
  listTopViewed(limit: number): Promise<AdminPostListItem[]>;
  // 指定时间之后发布的文章发布时间（仪表盘趋势用）
  listPublishedSince(since: Date): Promise<Date[]>;
  // 未设置封面的文章数
  countWithoutCover(): Promise<number>;
  // 已设置阅读密码的文章数
  countEncrypted(): Promise<number>;
  // 最近一条定时发布时间
  findNextScheduledAt(): Promise<Date | null>;
}
