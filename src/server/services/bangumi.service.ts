import type { BangumiApiResponse } from "@/types/bangumi-api-response";
import type { MediaShelfItem } from "@/types/media-shelf-item";
import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import { loadMediaCollectionCache } from "./media-collection-cache";
import { normalizeApiBase, requestJson } from "./media-fetch";
import { filterByNsfwMode, matchesNsfwKeyword } from "./media-nsfw";
import type { BangumiService } from "./bangumi.service.interface";

const DEFAULT_API_URL = "https://bgmapi.anibt.net";
const DEFAULT_SUBJECT_BASE_URL = "https://bgm.tv/subject";
const PAGE_SIZE = 50;
const MAX_TOTAL = 1000;

const categories = [
  { id: "anime", label: "动画", subjectType: 2, wish: "想看", doing: "在看", done: "看过" },
  { id: "book", label: "书籍", subjectType: 1, wish: "想读", doing: "在读", done: "读过" },
  { id: "music", label: "音乐", subjectType: 3, wish: "想听", doing: "在听", done: "听过" },
  { id: "game", label: "游戏", subjectType: 4, wish: "想玩", doing: "在玩", done: "玩过" },
  { id: "real", label: "三次元", subjectType: 6, wish: "想看", doing: "在看", done: "看过" },
] as const;

// 从用户名或个人主页地址中提取 Bangumi 用户名
function normalizeUsername(input: string): string {
  const value = input.trim();
  if (!value) {
    return "";
  }
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^@/, "");
  }
  try {
    const segments = new URL(value).pathname.split("/").filter(Boolean);
    const userIndex = segments.findIndex((segment) => segment === "user");
    return userIndex >= 0 ? segments[userIndex + 1] ?? "" : segments.at(-1) ?? "";
  } catch {
    return "";
  }
}

// 安全读取接口中的文本字段
function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// 安全读取接口中的数字字段
function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// 按收藏分类生成对应的中文状态文案
function readStatus(categoryId: string, collectionType: number): { key: string; label: string } {
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  if (collectionType === 1) return { key: "wish", label: category.wish };
  if (collectionType === 2) return { key: "done", label: category.done };
  if (collectionType === 3) return { key: "doing", label: category.doing };
  if (collectionType === 4) return { key: "on-hold", label: "搁置" };
  if (collectionType === 5) return { key: "dropped", label: "抛弃" };
  return { key: "unknown", label: "未分类" };
}

// 生成动画、书籍与三次元条目的章节进度
function readProgress(
  categoryId: string,
  epStatus: number,
  eps: number,
  volStatus: number,
  volumes: number,
): string {
  if (categoryId === "book") {
    if (volStatus > 0) return `读到 ${volStatus}${volumes > 0 ? `/${volumes}` : ""} 卷`;
    if (epStatus > 0) return `读到 ${epStatus}${eps > 0 ? `/${eps}` : ""} 话`;
    return "";
  }
  if (categoryId === "anime" || categoryId === "real") {
    if (epStatus <= 0) return "";
    return `看到 ${epStatus}${eps > 0 ? `/${eps}` : ""} 话`;
  }
  return "";
}

// 逐页读取一个 Bangumi 分类，直到达到总数或单页上限
async function fetchCategory(
  username: string,
  apiUrl: string,
  categoryId: string,
  subjectType: number,
): Promise<{ categoryId: string; label: string; items: NonNullable<BangumiApiResponse["data"]> }> {
  const items: NonNullable<BangumiApiResponse["data"]> = [];
  let offset = 0;
  while (offset < MAX_TOTAL) {
    const url = new URL(`${apiUrl}/v0/users/${encodeURIComponent(username)}/collections`);
    url.searchParams.set("subject_type", String(subjectType));
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    const response = await requestJson<BangumiApiResponse>(
      url.toString(),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Firefly-Dynamic/1.0",
        },
      },
      "Bangumi ",
    );
    const batch = Array.isArray(response.data) ? response.data : [];
    items.push(...batch);
    offset += PAGE_SIZE;
    if (batch.length < PAGE_SIZE || items.length >= readNumber(response.total)) {
      break;
    }
  }
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  return { categoryId, label: category.label, items };
}

// 把 Bangumi 收藏映射为通用媒体卡片
function mapCollection(raw: BangumiApiResponse["data"], subjectBaseUrl: string): MediaShelfItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((entry) => {
    const subject = entry.subject;
    if (!subject) {
      return [];
    }
    const id = readNumber(subject.id) || readNumber(entry.subject_id);
    const title = readText(subject.name_cn) || readText(subject.name);
    if (id <= 0 || !title) {
      return [];
    }
    const type = readNumber(entry.subject_type) || 2;
    const category = categories.find((item) => item.subjectType === type) ?? categories[0];
    const status = readStatus(category.id, readNumber(entry.type));
    const images = subject.images;
    const originalTitle = readText(subject.name);
    const score = readNumber(entry.rate) || readNumber(subject.score);
    const communityScore = readNumber(subject.score);
    const year = readText(subject.date).slice(0, 4);
    const tags = Array.isArray(entry.tags) && entry.tags.length > 0
      ? entry.tags
      : (subject.tags ?? []).map((tag) => readText(tag.name));
    const nsfw = subject.nsfw === true
      || tags.some(matchesNsfwKeyword)
      || (subject.tags ?? []).some((tag) => matchesNsfwKeyword(tag.name));
    return [{
      id: String(id),
      title,
      subtitle: originalTitle && originalTitle !== title ? originalTitle : "",
      cover: readText(images?.common) || readText(images?.large) || readText(images?.medium) || readText(images?.small),
      link: `${subjectBaseUrl}/${id}`,
      categoryId: category.id,
      categoryLabel: category.label,
      statusKey: status.key,
      statusLabel: status.label,
      score,
      communityScore,
      scoreLabel: "Bangumi",
      meta: [year, readNumber(subject.rank) > 0 ? `Rank ${readNumber(subject.rank)}` : ""].filter(Boolean).join(" · "),
      progress: readProgress(
        category.id,
        readNumber(entry.ep_status),
        readNumber(subject.eps),
        readNumber(entry.vol_status),
        readNumber(subject.volumes),
      ),
      summary: readText(entry.comment) || readText(subject.short_summary),
      tags: tags.map(readText).filter(Boolean).slice(0, 3),
      sortDate: readText(entry.updated_at) || readText(subject.date),
      nsfw,
    }];
  });
}

// Bangumi 收藏服务默认实现
export class DefaultBangumiService implements BangumiService {
  async getCollection(
    usernameInput: string,
    apiUrlInput: string,
    subjectBaseUrlInput: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult> {
    const username = normalizeUsername(usernameInput);
    if (!username) {
      return {
        status: "not-configured",
        items: [],
        fetchedAt: new Date().toISOString(),
        message: "请在后台「站点设置 → 番组计划」填写 Bangumi 用户名。",
        warning: "",
      };
    }
    const apiUrl = normalizeApiBase(apiUrlInput, DEFAULT_API_URL);
    const subjectBaseUrl = normalizeApiBase(subjectBaseUrlInput, DEFAULT_SUBJECT_BASE_URL);
    return loadMediaCollectionCache({
      cacheKey: `bangumi:${username}:${apiUrl}:${subjectBaseUrl}:${nsfwMode}`,
      cacheMinutes,
      fallbackMessage: "暂时无法读取 Bangumi 收藏数据。",
      load: async () => {
        const groups = await Promise.all(
          categories.map((category) =>
            fetchCategory(username, apiUrl, category.id, category.subjectType),
          ),
        );
        const mappedItems = groups.flatMap((group) => mapCollection(group.items, subjectBaseUrl));
        const items = filterByNsfwMode(mappedItems, nsfwMode, (item) => item.nsfw);
        return {
          status: items.length > 0 ? "ready" : "empty",
          items,
          fetchedAt: new Date().toISOString(),
          message: items.length > 0 ? "" : "当前账号没有可展示的 Bangumi 收藏。",
          warning: "",
        } satisfies MediaShelfResult;
      },
    });
  }
}
