// 系统信息仓储接口：采集数据库与媒体存储占用（供仪表盘系统信息卡使用）
export interface AdminSystemRepository {
  // 数据库总占用（数据 + 索引，单位字节）
  getDatabaseBytes(): Promise<number>;
  // 媒体占用（文件数与总大小，按媒体表记录统计）
  getMediaUsage(): Promise<{ files: number; bytes: number }>;
}