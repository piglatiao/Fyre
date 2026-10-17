import type { FriendLinkRecord } from "@/types/friend-link-record";

// 友链前台仓储接口：仅负责读取已启用数据
export interface FriendLinkRepository {
  // 已启用友链：权重降序，同权重按创建顺序升序
  listEnabled(): Promise<FriendLinkRecord[]>;
}
