import type { FriendLink } from "@/types/friend-link";

// 友链前台服务接口
export interface FriendService {
  // 获取启用友链（已按权重排序）
  listEnabled(): Promise<FriendLink[]>;
}
