import type { MediaShelfItem } from "@/types/media-shelf-item";
import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import type { VndbApiResponse } from "@/types/vndb-api-response";
import { loadMediaCollectionCache } from "./media-collection-cache";
import { normalizeApiBase, requestJson } from "./media-fetch";
import { filterByNsfwMode, matchesNsfwKeyword } from "./media-nsfw";
import type { VndbService } from "./vndb.service.interface";

const DEFAULT_API_URL = "https://api.vndb.org/kana";
const DEFAULT_VN_BASE_URL = "https://vndb.org";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const FIELDS = [
  "id",
  "vote",
  "notes",
  "started",
  "finished",
  "labels{label}",
  "vn{id,title,alttitle,released,languages,platforms,image{url,thumbnail,sexual,violence},rating,votecount,length,length_minutes,developers{name},tags{name}}",
].join(",");

const STATUS_ORDER = ["wishlist", "playing", "finished", "stalled", "dropped", "unknown"];
const STATUS_LABELS: Record<string, string> = {
  wishlist: "想玩",
  playing: "在玩",
  finished: "玩过",
  stalled: "搁置",
  dropped: "抛弃",
  unknown: "未分类",
};

// 从用户 ID 或个人主页地址中提取 VNDB 用户标识
function normalizeUserId(input: string): string {
  const value = input.trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).pathname.split("/").filter(Boolean).at(-1) ?? "";
    } catch {
      return "";
    }
  }
  if (/^\d+$/.test(value)) {
    return `u${value}`;
  }
  return /^u\d+$/i.test(value) ? value.toLowerCase() : value;
}

// 把 VNDB 自定义标签归一化到固定状态键
function normalizeLabel(label: string): string {
  const lower = label.trim().toLowerCase();
  if (/wish|want/.test(lower)) return "wishlist";
  if (/play/.test(lower)) return "playing";
  if (/finish|complete|clear|done/.test(lower)) return "finished";
  if (/stall|hold|pause/.test(lower)) return "stalled";
  if (/drop|abandon/.test(lower)) return "dropped";
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

// 读取首个人工分类标签作为卡片状态
function readStatus(entry: NonNullable<VndbApiResponse["results"]>[number]): {
  key: string;
  label: string;
} {
  const rawLabels = Array.isArray(entry.labels) ? entry.labels : [];
  for (const status of STATUS_ORDER) {
    const matched = rawLabels.find((label) => normalizeLabel(label.label ?? "") === status);
    if (matched) {
      return { key: status, label: STATUS_LABELS[status] ?? matched.label ?? status };
    }
  }
  const first = rawLabels.find((label) => Boolean(label.label));
  if (!first?.label) {
    return { key: "unknown", label: STATUS_LABELS.unknown };
  }
  const key = normalizeLabel(first.label);
  return { key, label: first.label };
}

// 将 VNDB 游戏长度等级和分钟数转换为中文说明
function readLength(length?: number | null, minutes?: number | null): string {
  const labels: Record<number, string> = {
    1: "极短篇",
    2: "短篇",
    3: "中篇",
    4: "长篇",
    5: "超长篇",
  };
  const parts: string[] = [];
  if (length && labels[length]) {
    parts.push(labels[length]);
  }
  if (minutes && minutes > 0) {
    parts.push(minutes >= 60 ? `~${(minutes / 60).toFixed(1)} 小时` : `~${minutes} 分钟`);
  }
  return parts.join(" · ");
}

// 逐页读取 VNDB 用户收藏
async function fetchItems(
  userId: string,
  apiToken: string,
  apiUrl: string,
): Promise<NonNullable<VndbApiResponse["results"]>> {
  const allItems: NonNullable<VndbApiResponse["results"]> = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (apiToken.trim()) {
      headers.Authorization = `Token ${apiToken.trim()}`;
    }
    const response = await requestJson<VndbApiResponse>(
      `${apiUrl}/ulist`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          user: userId,
          fields: FIELDS,
          results: PAGE_SIZE,
          page,
        }),
      },
      "VNDB ",
    );
    const batch = Array.isArray(response.results) ? response.results : [];
    allItems.push(...batch);
    if (!response.more || batch.length === 0) {
      break;
    }
  }
  return allItems;
}

// 把 VNDB 收藏映射为通用媒体卡片
function mapItems(raw: NonNullable<VndbApiResponse["results"]>, vnBaseUrl: string): MediaShelfItem[] {
  const items = raw.flatMap((entry) => {
    const vn = entry.vn;
    const title = (vn?.title ?? "").trim();
    const id = (vn?.id ?? entry.id ?? "").trim();
    if (!vn || !title || !id) {
      return [];
    }
    const status = readStatus(entry);
    const rating = typeof vn.rating === "number" ? Number((vn.rating / 10).toFixed(1)) : 0;
    const vote = typeof entry.vote === "number" ? entry.vote : 0;
    const year = (vn.released ?? "").slice(0, 4);
    const developer = (vn.developers ?? []).map((item) => item.name?.trim()).filter(Boolean).slice(0, 2).join(" / ");
    const length = readLength(vn.length, vn.length_minutes);
    const playRange = [entry.started, entry.finished].filter(Boolean).join(" ~ ");
    const tags = (vn.tags ?? []).map((tag) => tag.name?.trim() ?? "").filter(Boolean).slice(0, 3);
    const nsfw = (vn.image?.sexual ?? 0) > 1
      || (vn.image?.violence ?? 0) > 1
      || tags.some(matchesNsfwKeyword);
    return [{
      id,
      title,
      subtitle: (vn.alttitle ?? "").trim() !== title ? (vn.alttitle ?? "").trim() : "",
      cover: (vn.image?.url ?? vn.image?.thumbnail ?? "").trim(),
      link: `${vnBaseUrl}/${id}`,
      categoryId: status.key,
      categoryLabel: status.label,
      statusKey: status.key,
      statusLabel: status.label,
      score: vote || rating,
      communityScore: rating,
      scoreLabel: "VNDB",
      meta: [year, length, developer].filter(Boolean).join(" · "),
      progress: playRange,
      summary: (entry.notes ?? "").trim(),
      tags,
      sortDate: entry.finished ?? entry.started ?? vn.released ?? "",
      nsfw,
    } satisfies MediaShelfItem];
  });
  return items.sort((a, b) => {
    const statusDiff = STATUS_ORDER.indexOf(a.statusKey) - STATUS_ORDER.indexOf(b.statusKey);
    return statusDiff || b.communityScore - a.communityScore;
  });
}

// VNDB 收藏服务默认实现
export class DefaultVndbService implements VndbService {
  async getCollection(
    userIdInput: string,
    apiToken: string,
    apiUrlInput: string,
    vnBaseUrlInput: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult> {
    const userId = normalizeUserId(userIdInput);
    if (!userId) {
      return {
        status: "not-configured",
        items: [],
        fetchedAt: new Date().toISOString(),
        message: "请在后台「站点设置 → VNDB」填写 VNDB 用户 ID。",
        warning: "",
      };
    }
    const apiUrl = normalizeApiBase(apiUrlInput, DEFAULT_API_URL);
    const vnBaseUrl = normalizeApiBase(vnBaseUrlInput, DEFAULT_VN_BASE_URL);
    return loadMediaCollectionCache({
      cacheKey: `vndb:${userId}:${apiUrl}:${Boolean(apiToken.trim())}:${nsfwMode}`,
      cacheMinutes,
      fallbackMessage: "暂时无法读取 VNDB 收藏数据。",
      load: async () => {
        const mappedItems = mapItems(await fetchItems(userId, apiToken, apiUrl), vnBaseUrl);
        const items = filterByNsfwMode(mappedItems, nsfwMode, (item) => item.nsfw);
        return {
          status: items.length > 0 ? "ready" : "empty",
          items,
          fetchedAt: new Date().toISOString(),
          message: items.length > 0 ? "" : "当前账号没有可展示的 VNDB 收藏。",
          warning: "",
        } satisfies MediaShelfResult;
      },
    });
  }
}
