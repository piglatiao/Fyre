import { normalizeBilibiliUid } from "@/lib/bilibili-uid";
import type { BilibiliAnime } from "@/types/bilibili-anime";
import type { BilibiliApiItem } from "@/types/bilibili-api-item";
import type { BilibiliApiPage } from "@/types/bilibili-api-page";
import type { BilibiliCollection } from "@/types/bilibili-collection";
import type { BilibiliService } from "./bilibili.service.interface";

const API_BASE = "https://api.bilibili.com/x/space/bangumi/follow/list";
const PAGE_SIZE = 30;
const MAX_PAGES = 50;
const FETCH_CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 350;
const MAX_CACHE_MINUTES = 1440;

// 进程内缓存：多个请求共享同一份收藏数据，避免每次访问都请求外部接口
const collectionCache = new Map<string, { expiresAt: number; collection: BilibiliCollection }>();
const pendingCollections = new Map<string, Promise<BilibiliCollection>>();

// 统一构造页面状态，避免各分支字段缺失
function buildCollection(
  status: BilibiliCollection["status"],
  options: Partial<Omit<BilibiliCollection, "status">> = {},
): BilibiliCollection {
  return {
    status,
    items: options.items ?? [],
    averageRating: options.averageRating ?? 0,
    fetchedAt: options.fetchedAt ?? new Date().toISOString(),
    warning: options.warning ?? "",
    message: options.message ?? "",
  };
}

// 安全读取数值字段
function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// 安全读取字符串字段
function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// 等待指定毫秒，供失败重试使用
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 把哔哩哔哩原始数据转换为页面条目
function mapItem(item: BilibiliApiItem): BilibiliAnime {
  const seasonId = readNumber(item.season_id);
  const poster = readText(item.cover).replace(/^http:\/\//i, "https://");
  return {
    id: readNumber(item.media_id) || seasonId,
    title: readText(item.title) || "未命名条目",
    seasonType: readNumber(item.season_type) || 1,
    seasonTypeName: readText(item.season_type_name),
    poster: poster || null,
    rating: readNumber(item.rating?.score),
    ratingCount: readNumber(item.rating?.count),
    summary: readText(item.summary) || readText(item.evaluate) || readText(item.brief),
    epStatus: readText(item.new_ep?.index_show),
    link: seasonId > 0 ? `https://www.bilibili.com/bangumi/play/ss${seasonId}` : "",
    releaseDate: readText(item.publish?.release_date) || readText(item.publish?.pub_time).slice(0, 10),
    tags: Array.isArray(item.styles) ? item.styles.map(readText).filter(Boolean).slice(0, 8) : [],
    viewCount: readNumber(item.stat?.view),
    followCount: readNumber(item.stat?.follow),
    isFinished: readNumber(item.is_finish) === 1,
    progress: readText(item.progress),
  };
}

// 请求单页数据，并对网络错误、异常响应码与业务错误做一次重试
async function requestPage(uid: string, type: number, page: number): Promise<BilibiliApiPage["data"]> {
  const url = new URL(API_BASE);
  url.searchParams.set("type", String(type));
  url.searchParams.set("vmid", uid);
  url.searchParams.set("pn", String(page));
  url.searchParams.set("ps", String(PAGE_SIZE));

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Referer: `https://space.bilibili.com/${uid}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`哔哩哔哩接口返回 HTTP ${response.status}`);
      }
      const payload = (await response.json()) as BilibiliApiPage;
      if (payload.code !== 0) {
        throw new Error(payload.message || `哔哩哔哩接口错误 ${payload.code ?? "未知"}`);
      }
      return payload.data;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await wait(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("哔哩哔哩接口请求失败");
}

// 拉取单个分区的全部条目：先取首页 total，再以受限并发补齐剩余分页
async function requestAllByType(uid: string, type: number): Promise<BilibiliApiItem[]> {
  const first = await requestPage(uid, type, 1);
  const items = Array.isArray(first?.list) ? [...first.list] : [];
  const total = readNumber(first?.total);
  const totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  let nextPage = 2;

  async function worker(): Promise<void> {
    while (nextPage <= totalPages) {
      const page = nextPage;
      nextPage += 1;
      const data = await requestPage(uid, type, page);
      if (Array.isArray(data?.list)) {
        items.push(...data.list);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, Math.max(0, totalPages - 1)) }, () => worker()),
  );
  return items;
}

// 哔哩哔哩收藏数据默认实现
export class DefaultBilibiliService implements BilibiliService {
  async getCollection(uidInput: string, cacheMinutes: number): Promise<BilibiliCollection> {
    const uid = normalizeBilibiliUid(uidInput);
    if (!uid) {
      return buildCollection("not-configured", {
        message: "请在后台「站点设置 → 哔哩哔哩追番」填写有效的 UID 或空间链接。",
      });
    }

    const ttlMinutes = Math.min(MAX_CACHE_MINUTES, Math.max(0, Math.round(cacheMinutes)));
    const cacheKey = `${uid}:${ttlMinutes}`;
    const cached = collectionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.collection;
    }

    const pending = pendingCollections.get(cacheKey);
    if (pending) {
      return pending;
    }

    const task = this.loadCollection(uid, ttlMinutes, cacheKey).finally(() => {
      pendingCollections.delete(cacheKey);
    });
    pendingCollections.set(cacheKey, task);
    return task;
  }

  // 读取并缓存数据；失败时优先返回过期缓存，避免整页不可用
  private async loadCollection(uid: string, ttlMinutes: number, cacheKey: string): Promise<BilibiliCollection> {
    try {
      const [animeItems, dramaItems] = await Promise.all([
        requestAllByType(uid, 1),
        requestAllByType(uid, 2),
      ]);
      const uniqueItems = new Map<number, BilibiliAnime>();
      for (const item of [...animeItems, ...dramaItems]) {
        const mapped = mapItem(item);
        if (mapped.id > 0 && !uniqueItems.has(mapped.id)) {
          uniqueItems.set(mapped.id, mapped);
        }
      }
      const items = [...uniqueItems.values()];
      const averageRating = items.length
        ? Number((items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1))
        : 0;
      const collection = buildCollection(items.length > 0 ? "ready" : "empty", {
        items,
        averageRating,
      });

      if (items.length > 0 && ttlMinutes > 0) {
        collectionCache.set(cacheKey, {
          expiresAt: Date.now() + ttlMinutes * 60_000,
          collection,
        });
      }
      return collection;
    } catch (error) {
      const stale = collectionCache.get(cacheKey);
      if (stale && stale.collection.items.length > 0) {
        return {
          ...stale.collection,
          warning: "实时数据更新失败，当前展示上次缓存结果。",
        };
      }
      return buildCollection("error", {
        message: error instanceof Error ? error.message : "暂时无法读取哔哩哔哩收藏数据。",
      });
    }
  }
}
