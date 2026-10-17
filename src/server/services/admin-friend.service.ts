import type { AdminFriendLinkRepository } from "@/server/repositories/admin-friend-link.repository.interface";
import type { AdminFriendLinkItem } from "@/types/admin-friend-link-item";
import type { FriendLinkInput } from "@/types/friend-link-input";
import type { AdminFriendService } from "./admin-friend.service.interface";
import { ServiceError } from "./service-error";

// 后台友链服务默认实现：统一清理标签并校验记录是否存在
export class DefaultAdminFriendService implements AdminFriendService {
  constructor(private readonly friends: AdminFriendLinkRepository) {}

  // 标签去空白、去重，且最多保留 8 个
  private normalize(input: FriendLinkInput): FriendLinkInput {
    const tags = [...new Set(input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))].slice(0, 8);
    return { ...input, tags };
  }

  async listAll(): Promise<AdminFriendLinkItem[]> {
    return this.friends.listAll();
  }

  async create(input: FriendLinkInput): Promise<{ id: number }> {
    return this.friends.create(this.normalize(input));
  }

  async update(id: number, input: FriendLinkInput): Promise<void> {
    const existing = await this.friends.findById(id);
    if (!existing) {
      throw new ServiceError("friend_link_not_found", "友链不存在或已被删除");
    }
    await this.friends.update(id, this.normalize(input));
  }

  async remove(id: number): Promise<void> {
    const existing = await this.friends.findById(id);
    if (!existing) {
      throw new ServiceError("friend_link_not_found", "友链不存在或已被删除");
    }
    await this.friends.remove(id);
  }
}
