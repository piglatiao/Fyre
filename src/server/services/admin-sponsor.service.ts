import type { AdminSponsorRepository } from "@/server/repositories/admin-sponsor.repository.interface";
import type { AdminSponsorMethod } from "@/types/admin-sponsor-method";
import type { AdminSponsorRecord } from "@/types/admin-sponsor-record";
import type { SponsorMethodInput } from "@/types/sponsor-method-input";
import type { SponsorRecordInput } from "@/types/sponsor-record-input";
import type { AdminSponsorService } from "./admin-sponsor.service.interface";
import { ServiceError } from "./service-error";

// 打赏后台服务默认实现：统一校验记录存在性
export class DefaultAdminSponsorService implements AdminSponsorService {
  constructor(private readonly sponsors: AdminSponsorRepository) {}

  async listMethods(): Promise<AdminSponsorMethod[]> {
    return this.sponsors.listMethods();
  }

  async createMethod(input: SponsorMethodInput): Promise<{ id: number }> {
    return this.sponsors.createMethod(input);
  }

  async updateMethod(id: number, input: SponsorMethodInput): Promise<void> {
    const existing = await this.sponsors.findMethodById(id);
    if (!existing) {
      throw new ServiceError("sponsor_method_not_found", "打赏方式不存在或已被删除");
    }
    await this.sponsors.updateMethod(id, input);
  }

  async removeMethod(id: number): Promise<void> {
    const existing = await this.sponsors.findMethodById(id);
    if (!existing) {
      throw new ServiceError("sponsor_method_not_found", "打赏方式不存在或已被删除");
    }
    await this.sponsors.removeMethod(id);
  }

  async listRecords(): Promise<AdminSponsorRecord[]> {
    return this.sponsors.listRecords();
  }

  async createRecord(input: SponsorRecordInput): Promise<{ id: number }> {
    return this.sponsors.createRecord(input);
  }

  async updateRecord(id: number, input: SponsorRecordInput): Promise<void> {
    const existing = await this.sponsors.findRecordById(id);
    if (!existing) {
      throw new ServiceError("sponsor_record_not_found", "打赏记录不存在或已被删除");
    }
    await this.sponsors.updateRecord(id, input);
  }

  async removeRecord(id: number): Promise<void> {
    const existing = await this.sponsors.findRecordById(id);
    if (!existing) {
      throw new ServiceError("sponsor_record_not_found", "打赏记录不存在或已被删除");
    }
    await this.sponsors.removeRecord(id);
  }
}
