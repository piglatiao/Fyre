import type { SponsorMethod } from "@/types/sponsor-method";
import type { SponsorRecord } from "@/types/sponsor-record";

// 打赏前台服务接口
export interface SponsorService {
  listMethods(): Promise<SponsorMethod[]>;
  listRecords(): Promise<SponsorRecord[]>;
}
