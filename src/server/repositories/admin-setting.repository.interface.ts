// 后台站点设置仓储接口：读取原始键值并批量写入
export interface AdminSettingRepository {
  // 读取全部设置项（key → JSON 字符串）
  findAll(): Promise<Record<string, string>>;
  // 批量写入设置项（存在则更新，不存在则创建）
  upsertMany(entries: { key: string; value: string }[]): Promise<void>;
}
