import type { MalApiResponse } from "@/types/mal-api-response";
import type { MediaShelfItem } from "@/types/media-shelf-item";
import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import { loadMediaCollectionCache } from "./media-collection-cache";
import { normalizeApiBase, requestJson } from "./media-fetch";
import { filterByNsfwMode, matchesNsfwKeyword } from "./media-nsfw";
import type { MalService } from "./mal.service.interface";

const DEFAULT_API_URL = "https://api.myanimelist.net/v2";
const DEFAULT_ANIME_BASE_URL = "https://myanimelist.net/anime";
const DEFAULT_MANGA_BASE_URL = "https://myanimelist.net/manga";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const FIELDS = {
  anime: [
    "id",
    "title",
    "main_picture",
    "alternative_titles",
    "mean",
    "media_type",
    "num_episodes",
    "genres",
    "start_season",
    "status",
    "list_status{status,score,num_episodes_watched,is_rewatching,updated_at,start_date,finish_date,comments}",
  ].join(","),
  manga: [
    "id",
    "title",
    "main_picture",
    "alternative_titles",
    "mean",
    "media_type",
    "num_chapters",
    "num_volumes",
    "genres",
    "start_date",
    "status",
    "list_status{status,score,num_chapters_read,num_volumes_read,is_rereading,updated_at,start_date,finish_date,comments}",
  ].join(","),
} as const;

const STATUS_LABELS: Record<string, string> = {
  watching: "在看",
  reading: "在读",
  completed: "完成",
  on_hold: "搁置",
  dropped: "抛弃",
  plan_to_watch: "想看",
  plan_to_read: "想读",
  unknown: "未分类",
};

const STATUS_KEYS: Record<string, string> = {
  watching: "doing",
  reading: "doing",
  completed: "done",
  on_hold: "on-hold",
  dropped: "dropped",
  plan_to_watch: "wish",
  plan_to_read: "wish",
  unknown: "unknown",
};

const SEASON_LABELS: Record<string, string> = {
  winter: "冬季",
  spring: "春季",
  summer: "夏季",
  fall: "秋季",
};

// 规范化个人主页地址为 MAL 用户名
function normalizeUsername(input: string): string {
  const value = input.trim();
  if (!value) {
    return "";
  }
  if (!/^https?:\/\//i.test(value)) {
    return value;
  }
  try {
    const segments = new URL(value).pathname.split("/").filter(Boolean);
    const profileIndex = segments.findIndex((segment) => segment === "profile");
    return profileIndex >= 0 ? segments[profileIndex + 1] ?? "" : segments.at(-1) ?? "";
  } catch {
    return "";
  }
}

// 逐页读取一类 MAL 列表
async function fetchList(
  kind: "anime" | "manga",
  username: string,
  clientId: string,
  apiUrl: string,
): Promise<NonNullable<MalApiResponse["data"]>> {
  const allItems: NonNullable<MalApiResponse["data"]> = [];
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const endpoint = kind === "anime" ? "animelist" : "mangalist";
    const url = new URL(`${apiUrl}/users/${encodeURIComponent(username)}/${endpoint}`);
    url.searchParams.set("fields", FIELDS[kind]);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    const response = await requestJson<MalApiResponse>(
      url.toString(),
      {
        headers: {
          Accept: "application/json",
          "X-MAL-CLIENT-ID": clientId,
        },
      },
      "MyAnimeList ",
    );
    const batch = Array.isArray(response.data) ? response.data : [];
    allItems.push(...batch);
    offset += PAGE_SIZE;
    if (!response.paging?.next || batch.length === 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return allItems;
}

// 生成动画季度或漫画起始年份
function readDateText(
  kind: "anime" | "manga",
  node: NonNullable<NonNullable<MalApiResponse["data"]>[number]["node"]>,
): string {
  if (kind === "manga") {
    return (node.start_date ?? "").slice(0, 4);
  }
  const year = node.start_season?.year ?? 0;
  const season = SEASON_LABELS[node.start_season?.season ?? ""] ?? "";
  return [season, year > 0 ? String(year) : ""].filter(Boolean).join(" ");
}

// 生成动画观看或漫画阅读进度
function readProgress(kind: "anime" | "manga", entry: NonNullable<MalApiResponse["data"]>[number]): string {
  if (kind === "anime") {
    const watched = entry.list_status?.num_episodes_watched ?? 0;
    const total = entry.node?.num_episodes ?? 0;
    return watched > 0 || total > 0 ? `已看 ${watched}${total > 0 ? `/${total}` : ""} 话` : "";
  }
  const chapters = entry.list_status?.num_chapters_read ?? 0;
  const chapterTotal = entry.node?.num_chapters ?? 0;
  const volumes = entry.list_status?.num_volumes_read ?? 0;
  const volumeTotal = entry.node?.num_volumes ?? 0;
  const chapterText = chapters > 0 || chapterTotal > 0 ? `已读 ${chapters}${chapterTotal > 0 ? `/${chapterTotal}` : ""} 话` : "";
  const volumeText = volumes > 0 ? `${volumes}${volumeTotal > 0 ? `/${volumeTotal}` : ""} 卷` : "";
  return [chapterText, volumeText].filter(Boolean).join(" · ");
}

// 把 MAL 列表映射为通用媒体卡片
function mapItems(
  kind: "anime" | "manga",
  raw: NonNullable<MalApiResponse["data"]>,
  baseUrl: string,
): MediaShelfItem[] {
  return raw.flatMap((entry) => {
    const node = entry.node;
    if (!node || !node.id || !node.title) {
      return [];
    }
    const status = entry.list_status?.status ?? "unknown";
    const statusLabel = STATUS_LABELS[status] ?? status;
    const statusKey = STATUS_KEYS[status] ?? "unknown";
    const mean = typeof node.mean === "number" ? Number(node.mean.toFixed(1)) : 0;
    const userScore = typeof entry.list_status?.score === "number" ? entry.list_status.score : 0;
    const alternate = node.alternative_titles;
    const subtitle = alternate?.en && alternate.en !== node.title
      ? alternate.en
      : alternate?.ja && alternate.ja !== node.title
        ? alternate.ja
        : "";
    const genres = (node.genres ?? []).map((genre) => genre.name?.trim() ?? "").filter(Boolean).slice(0, 3);
    const nsfw = genres.some(matchesNsfwKeyword);
    return [{
      id: String(node.id),
      title: node.title,
      subtitle,
      cover: node.main_picture?.large ?? node.main_picture?.medium ?? "",
      link: `${baseUrl}/${node.id}`,
      categoryId: kind,
      categoryLabel: kind === "anime" ? "动画" : "漫画",
      statusKey,
      statusLabel,
      score: userScore || mean,
      communityScore: mean,
      scoreLabel: "MAL",
      meta: [readDateText(kind, node), (node.media_type ?? "").toUpperCase()].filter(Boolean).join(" · "),
      progress: readProgress(kind, entry),
      summary: (entry.list_status?.comments ?? "").trim(),
      tags: genres,
      sortDate: entry.list_status?.updated_at ?? entry.list_status?.start_date ?? node.start_date ?? "",
      nsfw,
    } satisfies MediaShelfItem];
  });
}

// MyAnimeList 收藏服务默认实现
export class DefaultMalService implements MalService {
  async getCollection(
    usernameInput: string,
    clientIdInput: string,
    apiUrlInput: string,
    animeBaseUrlInput: string,
    mangaBaseUrlInput: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult> {
    const username = normalizeUsername(usernameInput);
    const clientId = clientIdInput.trim();
    if (!username || !clientId) {
      return {
        status: "not-configured",
        items: [],
        fetchedAt: new Date().toISOString(),
        message: "请在后台「站点设置 → MyAnimeList」填写用户名和 Client ID。",
        warning: "",
      };
    }
    const apiUrl = normalizeApiBase(apiUrlInput, DEFAULT_API_URL);
    const animeBaseUrl = normalizeApiBase(animeBaseUrlInput, DEFAULT_ANIME_BASE_URL);
    const mangaBaseUrl = normalizeApiBase(mangaBaseUrlInput, DEFAULT_MANGA_BASE_URL);
    return loadMediaCollectionCache({
      cacheKey: `mal:${username}:${apiUrl}:${clientId.slice(-8)}:${nsfwMode}`,
      cacheMinutes,
      fallbackMessage: "暂时无法读取 MyAnimeList 收藏数据。",
      load: async () => {
        const outcomes = await Promise.allSettled([
          fetchList("anime", username, clientId, apiUrl),
          fetchList("manga", username, clientId, apiUrl),
        ]);
        const items: MediaShelfItem[] = [];
        const warnings: string[] = [];
        const animeResult = outcomes[0];
        if (animeResult.status === "fulfilled") {
          items.push(...mapItems("anime", animeResult.value, animeBaseUrl));
        } else {
          warnings.push("动画列表读取失败");
        }
        const mangaResult = outcomes[1];
        if (mangaResult.status === "fulfilled") {
          items.push(...mapItems("manga", mangaResult.value, mangaBaseUrl));
        } else {
          warnings.push("漫画列表读取失败");
        }
        if (outcomes.every((outcome) => outcome.status === "rejected")) {
          const reason = outcomes[0].status === "rejected" ? outcomes[0].reason : null;
          throw reason instanceof Error ? reason : new Error("MyAnimeList 动画与漫画列表均读取失败");
        }
        const visibleItems = filterByNsfwMode(items, nsfwMode, (item) => item.nsfw);
        return {
          status: visibleItems.length > 0 ? "ready" : "empty",
          items: visibleItems,
          fetchedAt: new Date().toISOString(),
          message: visibleItems.length > 0 ? "" : "当前账号没有可展示的 MyAnimeList 收藏。",
          warning: warnings.length > 0 ? `${warnings.join("，")}，当前展示可读取的部分。` : "",
        } satisfies MediaShelfResult;
      },
    });
  }
}
