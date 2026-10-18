import type { MusicTrack } from "@/types/music-track";
import type { SiteSettings } from "@/types/site-settings";
import type { MetingMusicService } from "./meting-music.service.interface";

// 在线歌单缓存时长与单次外部请求超时
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 7000;

// 解析外部返回的字符串字段：空串视为缺失
function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// 仅接受 HTTP(S) 媒体地址，防止脏数据生成危险链接
function readHttpUrl(value: unknown): string {
  const text = readText(value);
  if (!text) {
    return "";
  }
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

// 替换 Meting 模板占位符：ID 与搜索词均按 URL 参数规则编码
function buildMetingUrl(template: string, settings: SiteSettings): string | null {
  if (!/^https?:\/\//i.test(template)) {
    return null;
  }
  try {
    const replaced = template
      .replaceAll(":server", encodeURIComponent(settings.musicMetingServer))
      .replaceAll(":type", encodeURIComponent(settings.musicMetingType))
      .replaceAll(":id", encodeURIComponent(settings.musicMetingId))
      .replaceAll(":r", String(Math.random()));
    const url = new URL(replaced);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    if (settings.musicMetingAuth) {
      url.searchParams.set("auth", settings.musicMetingAuth);
    }
    return url.toString();
  } catch {
    return null;
  }
}

// 把 Meting 返回项映射为前台曲目；缺失标题或音频地址的条目直接丢弃
function mapMetingTrack(item: unknown, index: number, settings: SiteSettings): MusicTrack | null {
  if (typeof item !== "object" || item === null) {
    return null;
  }
  const record = item as Record<string, unknown>;
  const title = readText(record.title) || readText(record.name);
  const audioUrl = readHttpUrl(record.url);
  if (!title || !audioUrl) {
    return null;
  }
  const rawLyrics = readText(record.lrc);
  const lyricsUrl = /^https?:\/\//i.test(rawLyrics) ? readHttpUrl(rawLyrics) : "";
  return {
    id: `meting-${settings.musicMetingServer}-${settings.musicMetingType}-${settings.musicMetingId}-${index}`,
    title,
    artist: readText(record.author) || readText(record.artist),
    audioUrl,
    coverUrl: readHttpUrl(record.pic) || readHttpUrl(record.cover),
    lyrics: lyricsUrl ? "" : rawLyrics,
    lyricsUrl: lyricsUrl || undefined,
  };
}

// Meting 在线歌单：主 API 失败后依次尝试备用地址，成功结果缓存五分钟
export class DefaultMetingMusicService implements MetingMusicService {
  // 缓存挂在类上，避免每次请求新建服务实例后丢失五分钟缓存
  private static cache: { key: string; expiresAt: number; tracks: MusicTrack[] } | null = null;

  async list(settings: SiteSettings): Promise<MusicTrack[]> {
    if (settings.musicMode !== "meting" || !settings.musicMetingId) {
      return [];
    }
    const key = JSON.stringify([
      settings.musicMetingApi,
      settings.musicMetingFallbackApis,
      settings.musicMetingServer,
      settings.musicMetingType,
      settings.musicMetingId,
      settings.musicMetingAuth,
    ]);
    const cached = DefaultMetingMusicService.cache;
    if (cached && cached.key === key && cached.expiresAt > Date.now()) {
      return cached.tracks;
    }

    const templates = [settings.musicMetingApi, ...settings.musicMetingFallbackApis].filter(Boolean);
    for (const template of templates) {
      const url = buildMetingUrl(template, settings);
      if (!url) {
        continue;
      }
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!response.ok) {
          continue;
        }
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) {
          continue;
        }
        const tracks = payload
          .map((item, index) => mapMetingTrack(item, index, settings))
          .filter((item): item is MusicTrack => item !== null);
        if (tracks.length > 0) {
          DefaultMetingMusicService.cache = { key, expiresAt: Date.now() + CACHE_TTL_MS, tracks };
          return tracks;
        }
      } catch {
        // 单个 API 超时、跨域或返回非 JSON 时继续尝试下一个地址
      }
    }
    return [];
  }
}
