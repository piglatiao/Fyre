import type { AdminPageDetail } from "@/types/admin-page-detail";
import type { AdminPageItem } from "@/types/admin-page-item";
import type { PageUpsertInput } from "@/types/page-upsert-input";

// 后台页面仓储接口
export interface AdminPageRepository {
  // 全部页面（列表，不含正文）
  listAll(): Promise<AdminPageItem[]>;
  // 按 id 查询详情
  findById(id: number): Promise<AdminPageDetail | null>;
  // slug 是否已存在（编辑时排除自身）
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
  // 新建页面
  create(input: PageUpsertInput): Promise<{ id: number }>;
  // 更新页面
  update(id: number, input: PageUpsertInput): Promise<void>;
  // 删除页面
  remove(id: number): Promise<void>;
  // 页面总数
  countAll(): Promise<number>;
}
