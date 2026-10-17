import type { AdminSponsorMethod } from "@/types/admin-sponsor-method";
import type { AdminSponsorRecord } from "@/types/admin-sponsor-record";
import type { SponsorMethodInput } from "@/types/sponsor-method-input";
import type { SponsorRecordInput } from "@/types/sponsor-record-input";

// 打赏后台仓储接口
export interface AdminSponsorRepository {
  listMethods(): Promise<AdminSponsorMethod[]>;
  findMethodById(id: number): Promise<AdminSponsorMethod | null>;
  createMethod(input: SponsorMethodInput): Promise<{ id: number }>;
  updateMethod(id: number, input: SponsorMethodInput): Promise<void>;
  removeMethod(id: number): Promise<void>;
  listRecords(): Promise<AdminSponsorRecord[]>;
  findRecordById(id: number): Promise<AdminSponsorRecord | null>;
  createRecord(input: SponsorRecordInput): Promise<{ id: number }>;
  updateRecord(id: number, input: SponsorRecordInput): Promise<void>;
  removeRecord(id: number): Promise<void>;
}
