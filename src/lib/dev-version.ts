import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

// 开发期源码版本戳：汇总 src/ 目录内源码文件的修改时间与数量，
// 供长期停留的标签页判断“页面代码是否已过期”，见 DevAutoReload 组件
const SRC_DIR = join(process.cwd(), "src");
const FILE_PATTERN = /\.(ts|tsx|css)$/;
const CACHE_TTL_MS = 2000;
const MAX_DEPTH = 8;

let cache: { stamp: string; at: number } | null = null;

// 递归扫描目录，累计最新修改时间与文件数量；扫描失败（文件被删等）直接跳过
async function scan(dir: string, depth: number, acc: { latest: number; count: number }): Promise<void> {
  if (depth > MAX_DEPTH) {
    return;
  }
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scan(full, depth + 1, acc);
      continue;
    }
    if (!FILE_PATTERN.test(entry.name)) {
      continue;
    }
    try {
      const info = await stat(full);
      acc.count += 1;
      if (info.mtimeMs > acc.latest) {
        acc.latest = info.mtimeMs;
      }
    } catch {
      // 扫描期间文件被删除时忽略
    }
  }
}

// 获取当前源码版本戳：生产环境固定返回 prod（不扫描磁盘）
export async function resolveDevVersionStamp(): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    return "prod";
  }
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.stamp;
  }
  const acc = { latest: 0, count: 0 };
  await scan(SRC_DIR, 0, acc);
  const stamp = `${acc.count}:${Math.round(acc.latest)}`;
  cache = { stamp, at: now };
  return stamp;
}