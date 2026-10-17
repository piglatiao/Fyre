import type { AdminPageDetail } from "@/types/admin-page-detail";
import type { AdminPageItem } from "@/types/admin-page-item";
import type { PageUpsertInput } from "@/types/page-upsert-input";

// 后台页面服务接口
export interface AdminPageService {
  // 全部页面（列表）
  list(): Promise<AdminPageItem[]>;
  // 详情
  getById(id: number): Promise<AdminPageDetail | null>;
  // 新建
  create(input: PageUpsertInput): Promise<{ id: number }>;
  // 更新
  update(id: number, input: PageUpsertInput): Promise<void>;
  // 删除
  remove(id: number): Promise<void>;
}
