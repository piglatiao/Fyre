// 仪表盘系统信息：运行时环境与存储占用（服务端采集）
export interface DashboardSystemInfo {
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  memoryRssBytes: number;
  databaseBytes: number;
  mediaFiles: number;
  mediaBytes: number;
}