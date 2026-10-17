// 站点设置仓储接口
export interface SettingRepository {
  // 读取全部设置项（key → JSON 字符串）
  findAll(): Promise<Record<string, string>>;
  // 读取设置表最近一次更新时间（前台据此判断后台是否保存过新设置）
  findLatestUpdatedAt(): Promise<Date | null>;
}
