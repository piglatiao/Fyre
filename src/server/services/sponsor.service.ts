import type { SponsorRepository } from "@/server/repositories/sponsor.repository.interface";
import type { SponsorMethod } from "@/types/sponsor-method";
import type { SponsorRecord } from "@/types/sponsor-record";
import type { SponsorService } from "./sponsor.service.interface";

// 打赏前台服务默认实现
export class DefaultSponsorService implements SponsorService {
  constructor(private readonly sponsors: SponsorRepository) {}

  async listMethods(): Promise<SponsorMethod[]> {
    return this.sponsors.listEnabledMethods();
  }

  async listRecords(): Promise<SponsorRecord[]> {
    return this.sponsors.listEnabledRecords();
  }
}
