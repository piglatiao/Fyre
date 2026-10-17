import type { SiteSettings } from "@/types/site-settings";

// 后台站点设置服务接口
export interface AdminSettingService {
  // 读取解析后的站点设置
  getSettings(): Promise<SiteSettings>;
  // 全量写入站点设置
  updateSettings(input: SiteSettings): Promise<void>;
}
