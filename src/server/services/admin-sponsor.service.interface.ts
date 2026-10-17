import type { AdminSponsorMethod } from "@/types/admin-sponsor-method";
import type { AdminSponsorRecord } from "@/types/admin-sponsor-record";
import type { SponsorMethodInput } from "@/types/sponsor-method-input";
import type { SponsorRecordInput } from "@/types/sponsor-record-input";

// 打赏后台服务接口
export interface AdminSponsorService {
  listMethods(): Promise<AdminSponsorMethod[]>;
  createMethod(input: SponsorMethodInput): Promise<{ id: number }>;
  updateMethod(id: number, input: SponsorMethodInput): Promise<void>;
  removeMethod(id: number): Promise<void>;
  listRecords(): Promise<AdminSponsorRecord[]>;
  createRecord(input: SponsorRecordInput): Promise<{ id: number }>;
  updateRecord(id: number, input: SponsorRecordInput): Promise<void>;
  removeRecord(id: number): Promise<void>;
}
