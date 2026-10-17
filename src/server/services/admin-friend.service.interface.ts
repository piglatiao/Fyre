import type { AdminFriendLinkItem } from "@/types/admin-friend-link-item";
import type { FriendLinkInput } from "@/types/friend-link-input";

// 友链后台服务接口
export interface AdminFriendService {
  // 全部友链
  listAll(): Promise<AdminFriendLinkItem[]>;
  // 新建友链
  create(input: FriendLinkInput): Promise<{ id: number }>;
  // 更新友链
  update(id: number, input: FriendLinkInput): Promise<void>;
  // 删除友链
  remove(id: number): Promise<void>;
}
