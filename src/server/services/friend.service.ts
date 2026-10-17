import type { FriendLinkRepository } from "@/server/repositories/friend-link.repository.interface";
import type { FriendLink } from "@/types/friend-link";
import type { FriendService } from "./friend.service.interface";

// 友链前台服务默认实现
export class DefaultFriendService implements FriendService {
  constructor(private readonly friends: FriendLinkRepository) {}

  async listEnabled(): Promise<FriendLink[]> {
    return this.friends.listEnabled();
  }
}
