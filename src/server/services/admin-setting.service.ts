import type { AdminSettingRepository } from "@/server/repositories/admin-setting.repository.interface";
import type { SettingRepository } from "@/server/repositories/setting.repository.interface";
import type { SiteSettings } from "@/types/site-settings";
import { DefaultSettingService } from "./setting.service";
import type { AdminSettingService } from "./admin-setting.service.interface";

// 后台站点设置服务默认实现：读取复用前台设置解析逻辑，写入统一序列化为 JSON
export class DefaultAdminSettingService implements AdminSettingService {
  private readonly reader: DefaultSettingService;

  constructor(
    reader: SettingRepository,
    private readonly writer: AdminSettingRepository,
  ) {
    this.reader = new DefaultSettingService(reader);
  }

  async getSettings(): Promise<SiteSettings> {
    return this.reader.getSiteSettings();
  }

  async updateSettings(input: SiteSettings): Promise<void> {
    const entries = Object.entries(input).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
    }));
    await this.writer.upsertMany(entries);
  }
}
