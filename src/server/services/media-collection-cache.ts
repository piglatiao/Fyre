import type { MediaShelfResult } from "@/types/media-shelf-result";

interface MediaCollectionCacheOptions {
  cacheKey: string;
  cacheMinutes: number;
  load: () => Promise<MediaShelfResult>;
  fallbackMessage: string;
}

// 进程内媒体缓存：合并并发请求，并在实时接口失败时回退最近成功结果
const resultCache = new Map<string, { expiresAt: number; result: MediaShelfResult }>();
const pendingRequests = new Map<string, Promise<MediaShelfResult>>();

export async function loadMediaCollectionCache(
  options: MediaCollectionCacheOptions,
): Promise<MediaShelfResult> {
  const ttlMinutes = Math.min(1440, Math.max(0, Math.round(options.cacheMinutes)));
  const cached = resultCache.get(options.cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const pending = pendingRequests.get(options.cacheKey);
  if (pending) {
    return pending;
  }

  const task = options
    .load()
    .then((result) => {
      if (result.items.length > 0 && ttlMinutes > 0) {
        resultCache.set(options.cacheKey, {
          expiresAt: Date.now() + ttlMinutes * 60_000,
          result,
        });
      }
      return result;
    })
    .catch((error: unknown) => {
      if (cached && cached.result.items.length > 0) {
        return {
          ...cached.result,
          warning: "实时数据更新失败，当前展示上次缓存结果。",
        };
      }
      return {
        status: "error" as const,
        items: [],
        fetchedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : options.fallbackMessage,
        warning: "",
      };
    })
    .finally(() => {
      pendingRequests.delete(options.cacheKey);
    });

  pendingRequests.set(options.cacheKey, task);
  return task;
}
