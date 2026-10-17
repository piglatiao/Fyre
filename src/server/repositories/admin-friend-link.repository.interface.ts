import type { AdminFriendLinkItem } from "@/types/admin-friend-link-item";
import type { FriendLinkInput } from "@/types/friend-link-input";

// 友链后台仓储接口
export interface AdminFriendLinkRepository {
  // 全部友链：权重降序、创建时间倒序
  listAll(): Promise<AdminFriendLinkItem[]>;
  // 按 id 查询
  findById(id: number): Promise<AdminFriendLinkItem | null>;
  // 新建
  create(input: FriendLinkInput): Promise<{ id: number }>;
  // 更新
  update(id: number, input: FriendLinkInput): Promise<void>;
  // 删除
  remove(id: number): Promise<void>;
}
