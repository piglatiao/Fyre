import type { PostStatus } from "@/generated/prisma/client";
import type { AdminPostDetail } from "@/types/admin-post-detail";
import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { PageResult } from "@/types/page-result";
import type { PostUpsertInput } from "@/types/post-upsert-input";

// 后台文章服务接口：封装 slug 生成与状态/时间规则
export interface AdminPostService {
  // 分页列表
  list(params: {
    page: number;
    pageSize: number;
    status?: PostStatus;
    keyword?: string;
  }): Promise<PageResult<AdminPostListItem>>;
  // 详情
  getById(id: number): Promise<AdminPostDetail | null>;
  // 新建
  create(input: PostUpsertInput): Promise<{ id: number }>;
  // 更新
  update(id: number, input: PostUpsertInput): Promise<void>;
  // 批量删除
  removeMany(ids: number[]): Promise<number>;
}
