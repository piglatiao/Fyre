import type { SiteSettings } from "@/types/site-settings";

// 站点设置服务接口
export interface SettingService {
  // 读取并解析站点设置：缺失或损坏的项回退为默认值
  getSiteSettings(): Promise<SiteSettings>;
  // 读取设置版本戳（设置表最近更新时间）：前台页面据此自动同步后台改动
  getSettingsVersion(): Promise<string>;
}
