import type { NavLink } from "@/types/nav-link";
import type { NavLinkChild } from "@/types/nav-link-child";
import type { FriendPageNote } from "@/types/friend-page-note";
import type { SettingRepository } from "@/server/repositories/setting.repository.interface";
import type { SiteSettings } from "@/types/site-settings";
import type { SocialLink } from "@/types/social-link";
import type { ThemeMode } from "@/types/theme-mode";
import type { WallpaperMode } from "@/types/wallpaper-mode";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import {
  DEFAULT_BANNER_HEIGHT_HOME,
  DEFAULT_BANNER_HEIGHT_NON_HOME,
  DEFAULT_FULLSCREEN_BLUR,
  DEFAULT_OVERLAY_BLUR,
  DEFAULT_THEME_HUE,
  DEFAULT_THEME_MODE,
  DEFAULT_WALLPAPER_MODE,
  normalizeBannerHeight,
  normalizeCardOpacity,
  normalizeHue,
  normalizeWallpaperBlur,
} from "@/lib/theme-config";
import type { SettingService } from "./setting.service.interface";

// 设置缺失或损坏时的兜底值
const fallbackSettings: SiteSettings = {
  siteName: "流萤",
  siteSubtitle: "记录技术与生活",
  siteDescription: "流萤动态博客：分享技术、生活与思考。",
  siteLogo: "",
  siteFavicon: "",
  footerText: "Powered by 流萤动态博客",
  icpNumber: "",
  seoKeywords: [],
  socialLinks: [],
  navLinks: [],
  commentsEnabled: true,
  commentsRequireApproval: false,
  friendPageTitle: "友链",
  friendPageDescription: "这里是我的朋友们，欢迎互相访问交流",
  friendShowCustomContent: true,
  friendShowComment: true,
  friendContactEmail: "",
  friendNotes: [
    { title: "互换原则", content: "请先将本站添加到您的友链页面，确认后会添加您的友链" },
    { title: "链接维护", content: "友链网站长期无法访问或内容违规，将会被移除" },
    { title: "内容要求", content: "内容积极向上，不含有任何违法违规内容" },
    { title: "站点要求", content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新" },
  ],
  sponsorUsage: "您的打赏将用于服务器维护、内容创作和功能开发，帮助我持续提供优质内容。",
  sponsorShowList: true,
  bilibiliEnabled: true,
  bilibiliUid: "38932988",
  bilibiliPageTitle: "哔哩哔哩",
  bilibiliPageDescription: "我的哔哩哔哩追番与追剧列表",
  bilibiliItemsPerPage: 24,
  bilibiliCacheMinutes: 60,
  bilibiliShowStats: true,
  bangumiEnabled: true,
  bangumiUsername: "1143164",
  bangumiApiUrl: "https://bgmapi.anibt.net",
  bangumiSubjectBaseUrl: "https://bgm.tv/subject",
  bangumiPageTitle: "番组计划",
  bangumiPageDescription: "我的 Bangumi 追番、读书、听歌与游戏收藏",
  bangumiItemsPerPage: 24,
  bangumiCacheMinutes: 60,
  bangumiNsfwMode: "hide",
  vndbEnabled: true,
  vndbUserId: "u358128",
  vndbApiToken: "",
  vndbApiUrl: "https://api.vndb.org/kana",
  vndbVnBaseUrl: "https://vndb.org",
  vndbPageTitle: "VNDB",
  vndbPageDescription: "我的视觉小说收藏与游玩记录",
  vndbItemsPerPage: 24,
  vndbCacheMinutes: 60,
  vndbNsfwMode: "hide",
  malEnabled: true,
  malUsername: "cuteleaf",
  malClientId: "0ef34371450f9c6c809deaadec6aa8f3",
  malApiUrl: "https://api.myanimelist.net/v2",
  malAnimeBaseUrl: "https://myanimelist.net/anime",
  malMangaBaseUrl: "https://myanimelist.net/manga",
  malPageTitle: "MyAnimeList",
  malPageDescription: "我的动画与漫画收藏",
  malItemsPerPage: 24,
  malCacheMinutes: 60,
  malNsfwMode: "hide",
  themeHue: DEFAULT_THEME_HUE,
  themeMode: DEFAULT_THEME_MODE,
  cardOpacity: 0.6,
  bannerTitle: "",
  bannerSubtitle: "",
  bannerSubtitles: [],
  bannerImageDesktop: "",
  bannerImageMobile: "",
  bannerVideoPoster: "",
  bannerWaves: true,
  wallpaperMode: DEFAULT_WALLPAPER_MODE,
  bannerHeightHome: DEFAULT_BANNER_HEIGHT_HOME,
  bannerHeightNonHome: DEFAULT_BANNER_HEIGHT_NON_HOME,
  overlayBlur: DEFAULT_OVERLAY_BLUR,
  fullscreenBlur: DEFAULT_FULLSCREEN_BLUR,
  typewriterEnabled: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  authorName: "",
  authorBio: "",
  authorAvatar: "",
  announcementText: "",
  siteStartDate: "",
};

// 解析 JSON 字符串设置项：解析失败返回 undefined
function parseJson(raw: string | undefined): unknown {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// 读取字符串设置项：类型不符或为空串时回退默认值
function readString(raw: string | undefined, fallback: string): string {
  const value = parseJson(raw);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

// 读取允许留空的字符串设置项
function readOptionalString(raw: string | undefined, fallback: string): string {
  const value = parseJson(raw);
  return typeof value === "string" ? value : fallback;
}

// 读取字符串数组设置项：过滤非字符串元素
function readStringArray(raw: string | undefined): string[] {
  const value = parseJson(raw);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

// 读取社交链接配置：仅保留同时含 label 与 url 的条目
function readSocialLinks(raw: string | undefined): SocialLink[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = record.label;
    const url = record.url;
    return typeof label === "string" && typeof url === "string" ? [{ label, url }] : [];
  });
}

// 读取友链注意事项：仅保留标题和说明均有效的条目
function readFriendNotes(raw: string | undefined): FriendPageNote[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) {
    return fallbackSettings.friendNotes;
  }
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const title = record.title;
    const content = record.content;
    return typeof title === "string" && typeof content === "string" && title.trim().length > 0
      ? [{ title: title.trim(), content: content.trim() }]
      : [];
  });
}

// 读取数值设置项：类型不符时回退默认值
function readNumber(raw: string | undefined, fallback: number): number {
  const value = parseJson(raw);
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// 读取布尔设置项：类型不符时回退默认值
function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  const value = parseJson(raw);
  return typeof value === "boolean" ? value : fallback;
}

// 读取壁纸模式：仅接受四种合法取值
function readWallpaperMode(raw: string | undefined): WallpaperMode {
  const value = parseJson(raw);
  return value === "banner" || value === "overlay" || value === "fullscreen" || value === "none"
    ? value
    : DEFAULT_WALLPAPER_MODE;
}

// 读取主题模式：仅接受三种合法取值
function readThemeMode(raw: string | undefined): ThemeMode {
  const value = parseJson(raw);
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME_MODE;
}

// 读取媒体收藏的 NSFW 模式：非法值回退为隐藏，避免意外展示敏感内容
function readMediaNsfwMode(raw: string | undefined, fallback: MediaNsfwMode): MediaNsfwMode {
  const value = parseJson(raw);
  return value === "off" || value === "blur" || value === "hide" ? value : fallback;
}

// 读取字符串数组设置项（保留空值过滤）
function readStringList(raw: string | undefined): string[] {
  return readStringArray(raw).filter((item) => item.length > 0);
}

// 读取导航子项配置：兼容旧数据，子项只允许一层
function readNavChildren(value: unknown): NavLinkChild[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = record.label;
    const href = record.href;
    return typeof label === "string" && typeof href === "string" && label.length > 0 && href.length > 0
      ? [{ label, href }]
      : [];
  });
}

// 读取导航链接配置：兼容旧版单层数据，并保留新的下拉子项
function readNavLinks(raw: string | undefined): NavLink[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = record.label;
    const href = record.href;
    if (typeof label !== "string" || typeof href !== "string" || label.length === 0) {
      return [];
    }
    const children = readNavChildren(record.children);
    if (href.length === 0 && children.length === 0) {
      return [];
    }
    return [{ label, href, children }];
  });
}

// 站点设置服务默认实现
export class DefaultSettingService implements SettingService {
  constructor(private readonly settings: SettingRepository) {}

  async getSiteSettings(): Promise<SiteSettings> {
    const raw = await this.settings.findAll();
    return {
      siteName: readString(raw.siteName, fallbackSettings.siteName),
      siteSubtitle: readString(raw.siteSubtitle, fallbackSettings.siteSubtitle),
      siteDescription: readString(raw.siteDescription, fallbackSettings.siteDescription),
      siteLogo: readString(raw.siteLogo, fallbackSettings.siteLogo),
      siteFavicon: readString(raw.siteFavicon, fallbackSettings.siteFavicon),
      footerText: readString(raw.footerText, fallbackSettings.footerText),
      icpNumber: readString(raw.icpNumber, fallbackSettings.icpNumber),
      seoKeywords: readStringArray(raw.seoKeywords),
      socialLinks: readSocialLinks(raw.socialLinks),
      navLinks: readNavLinks(raw.navLinks),
      commentsEnabled: readBoolean(raw.commentsEnabled, fallbackSettings.commentsEnabled),
      commentsRequireApproval: readBoolean(
        raw.commentsRequireApproval,
        fallbackSettings.commentsRequireApproval,
      ),
      friendPageTitle: readString(raw.friendPageTitle, fallbackSettings.friendPageTitle),
      friendPageDescription: readOptionalString(raw.friendPageDescription, fallbackSettings.friendPageDescription),
      friendShowCustomContent: readBoolean(raw.friendShowCustomContent, fallbackSettings.friendShowCustomContent),
      friendShowComment: readBoolean(raw.friendShowComment, fallbackSettings.friendShowComment),
      friendContactEmail: readString(raw.friendContactEmail, fallbackSettings.friendContactEmail),
      friendNotes: readFriendNotes(raw.friendNotes),
      sponsorUsage: readString(raw.sponsorUsage, fallbackSettings.sponsorUsage),
      sponsorShowList: readBoolean(raw.sponsorShowList, fallbackSettings.sponsorShowList),
      bilibiliEnabled: readBoolean(raw.bilibiliEnabled, fallbackSettings.bilibiliEnabled),
      bilibiliUid: readOptionalString(raw.bilibiliUid, fallbackSettings.bilibiliUid),
      bilibiliPageTitle: readString(raw.bilibiliPageTitle, fallbackSettings.bilibiliPageTitle),
      bilibiliPageDescription: readOptionalString(
        raw.bilibiliPageDescription,
        fallbackSettings.bilibiliPageDescription,
      ),
      bilibiliItemsPerPage: Math.min(
        60,
        Math.max(6, Math.round(readNumber(raw.bilibiliItemsPerPage, fallbackSettings.bilibiliItemsPerPage))),
      ),
      bilibiliCacheMinutes: Math.min(
        1440,
        Math.max(0, Math.round(readNumber(raw.bilibiliCacheMinutes, fallbackSettings.bilibiliCacheMinutes))),
      ),
      bilibiliShowStats: readBoolean(raw.bilibiliShowStats, fallbackSettings.bilibiliShowStats),
      bangumiEnabled: readBoolean(raw.bangumiEnabled, fallbackSettings.bangumiEnabled),
      bangumiUsername: readOptionalString(raw.bangumiUsername, fallbackSettings.bangumiUsername),
      bangumiApiUrl: readOptionalString(raw.bangumiApiUrl, fallbackSettings.bangumiApiUrl),
      bangumiSubjectBaseUrl: readOptionalString(raw.bangumiSubjectBaseUrl, fallbackSettings.bangumiSubjectBaseUrl),
      bangumiPageTitle: readString(raw.bangumiPageTitle, fallbackSettings.bangumiPageTitle),
      bangumiPageDescription: readOptionalString(raw.bangumiPageDescription, fallbackSettings.bangumiPageDescription),
      bangumiItemsPerPage: Math.min(
        60,
        Math.max(6, Math.round(readNumber(raw.bangumiItemsPerPage, fallbackSettings.bangumiItemsPerPage))),
      ),
      bangumiCacheMinutes: Math.min(
        1440,
        Math.max(0, Math.round(readNumber(raw.bangumiCacheMinutes, fallbackSettings.bangumiCacheMinutes))),
      ),
      bangumiNsfwMode: readMediaNsfwMode(raw.bangumiNsfwMode, fallbackSettings.bangumiNsfwMode),
      vndbEnabled: readBoolean(raw.vndbEnabled, fallbackSettings.vndbEnabled),
      vndbUserId: readOptionalString(raw.vndbUserId, fallbackSettings.vndbUserId),
      vndbApiToken: readOptionalString(raw.vndbApiToken, fallbackSettings.vndbApiToken),
      vndbApiUrl: readOptionalString(raw.vndbApiUrl, fallbackSettings.vndbApiUrl),
      vndbVnBaseUrl: readOptionalString(raw.vndbVnBaseUrl, fallbackSettings.vndbVnBaseUrl),
      vndbPageTitle: readString(raw.vndbPageTitle, fallbackSettings.vndbPageTitle),
      vndbPageDescription: readOptionalString(raw.vndbPageDescription, fallbackSettings.vndbPageDescription),
      vndbItemsPerPage: Math.min(
        60,
        Math.max(6, Math.round(readNumber(raw.vndbItemsPerPage, fallbackSettings.vndbItemsPerPage))),
      ),
      vndbCacheMinutes: Math.min(
        1440,
        Math.max(0, Math.round(readNumber(raw.vndbCacheMinutes, fallbackSettings.vndbCacheMinutes))),
      ),
      vndbNsfwMode: readMediaNsfwMode(raw.vndbNsfwMode, fallbackSettings.vndbNsfwMode),
      malEnabled: readBoolean(raw.malEnabled, fallbackSettings.malEnabled),
      malUsername: readOptionalString(raw.malUsername, fallbackSettings.malUsername),
      malClientId: readOptionalString(raw.malClientId, fallbackSettings.malClientId),
      malApiUrl: readOptionalString(raw.malApiUrl, fallbackSettings.malApiUrl),
      malAnimeBaseUrl: readOptionalString(raw.malAnimeBaseUrl, fallbackSettings.malAnimeBaseUrl),
      malMangaBaseUrl: readOptionalString(raw.malMangaBaseUrl, fallbackSettings.malMangaBaseUrl),
      malPageTitle: readString(raw.malPageTitle, fallbackSettings.malPageTitle),
      malPageDescription: readOptionalString(raw.malPageDescription, fallbackSettings.malPageDescription),
      malItemsPerPage: Math.min(
        60,
        Math.max(6, Math.round(readNumber(raw.malItemsPerPage, fallbackSettings.malItemsPerPage))),
      ),
      malCacheMinutes: Math.min(
        1440,
        Math.max(0, Math.round(readNumber(raw.malCacheMinutes, fallbackSettings.malCacheMinutes))),
      ),
      malNsfwMode: readMediaNsfwMode(raw.malNsfwMode, fallbackSettings.malNsfwMode),
      themeHue: normalizeHue(readNumber(raw.themeHue, DEFAULT_THEME_HUE)),
      themeMode: readThemeMode(raw.themeMode),
      cardOpacity: normalizeCardOpacity(readNumber(raw.cardOpacity, fallbackSettings.cardOpacity)),
      bannerTitle: readString(raw.bannerTitle, fallbackSettings.bannerTitle),
      bannerSubtitle: readString(raw.bannerSubtitle, fallbackSettings.bannerSubtitle),
      bannerSubtitles: readStringList(raw.bannerSubtitles),
      bannerImageDesktop: readString(raw.bannerImageDesktop, fallbackSettings.bannerImageDesktop),
      bannerImageMobile: readString(raw.bannerImageMobile, fallbackSettings.bannerImageMobile),
      bannerVideoPoster: readString(raw.bannerVideoPoster, fallbackSettings.bannerVideoPoster),
      bannerWaves: readBoolean(raw.bannerWaves, fallbackSettings.bannerWaves),
      wallpaperMode: readWallpaperMode(raw.wallpaperMode),
      bannerHeightHome: normalizeBannerHeight(
        readNumber(raw.bannerHeightHome, DEFAULT_BANNER_HEIGHT_HOME),
        DEFAULT_BANNER_HEIGHT_HOME,
      ),
      bannerHeightNonHome: normalizeBannerHeight(
        readNumber(raw.bannerHeightNonHome, DEFAULT_BANNER_HEIGHT_NON_HOME),
        DEFAULT_BANNER_HEIGHT_NON_HOME,
      ),
      overlayBlur: normalizeWallpaperBlur(readNumber(raw.overlayBlur, DEFAULT_OVERLAY_BLUR), DEFAULT_OVERLAY_BLUR),
      fullscreenBlur: normalizeWallpaperBlur(
        readNumber(raw.fullscreenBlur, DEFAULT_FULLSCREEN_BLUR),
        DEFAULT_FULLSCREEN_BLUR,
      ),
      typewriterEnabled: readBoolean(raw.typewriterEnabled, fallbackSettings.typewriterEnabled),
      showLeftSidebar: readBoolean(raw.showLeftSidebar, fallbackSettings.showLeftSidebar),
      showRightSidebar: readBoolean(raw.showRightSidebar, fallbackSettings.showRightSidebar),
      authorName: readString(raw.authorName, fallbackSettings.authorName),
      authorBio: readString(raw.authorBio, fallbackSettings.authorBio),
      authorAvatar: readString(raw.authorAvatar, fallbackSettings.authorAvatar),
      announcementText: readString(raw.announcementText, fallbackSettings.announcementText),
      siteStartDate: readString(raw.siteStartDate, fallbackSettings.siteStartDate),
    };
  }

  async getSettingsVersion(): Promise<string> {
    const latest = await this.settings.findLatestUpdatedAt();
    return latest ? String(latest.getTime()) : "0";
  }
}
