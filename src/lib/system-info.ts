// 运行时信息：Node 版本、平台、运行时长与常驻内存（供仪表盘系统信息卡展示）
export function getRuntimeInfo(): {
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  memoryRssBytes: number;
} {
  return {
    nodeVersion: process.versions.node,
    platform: `${process.platform} ${process.arch}`,
    uptimeSeconds: Math.round(process.uptime()),
    memoryRssBytes: process.memoryUsage().rss,
  };
}

// 运行时长格式化：不足 1 小时显示分钟，其余显示小时与分钟
export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours <= 0) {
    return `${Math.max(1, minutes)} 分钟`;
  }
  return `${hours} 小时 ${minutes} 分钟`;
}