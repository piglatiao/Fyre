import type { SponsorMethod } from "@/types/sponsor-method";
import type { SponsorRecord } from "@/types/sponsor-record";

// 打赏前台仓储接口
export interface SponsorRepository {
  // 已启用打赏方式
  listEnabledMethods(): Promise<SponsorMethod[]>;
  // 已启用打赏记录
  listEnabledRecords(): Promise<SponsorRecord[]>;
}
