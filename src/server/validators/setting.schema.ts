import { z } from "zod";

// 导航下拉子项校验
const navLinkChildSchema = z.object({
  label: z.string().trim().min(1, "请填写下拉项名称").max(50),
  href: z.string().trim().min(1, "请填写下拉项地址").max(200),
});

// 站点设置入参校验
export const settingSchema = z.object({
  siteName: z.string().trim().min(1, "请填写站点名称").max(50, "站点名称不能超过 50 字"),
  siteSubtitle: z.string().trim().max(100, "副标题过长").default(""),
  siteDescription: z.string().trim().max(300, "站点描述过长").default(""),
  siteLogo: z.string().trim().max(500, "Logo 地址过长").default(""),
  siteFavicon: z.string().trim().max(500, "图标地址过长").default(""),
  footerText: z.string().trim().max(200, "页脚文案过长").default(""),
  icpNumber: z.string().trim().max(100, "备案号过长").default(""),
  seoKeywords: z.array(z.string().trim().min(1)).max(20, "关键词过多").default([]),
  socialLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1, "请填写名称").max(50),
        url: z.url("链接格式不正确"),
      }),
    )
    .max(20, "社交链接过多")
    .default([]),
  navLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1, "请填写导航名称").max(50),
        href: z.string().trim().max(200).default(""),
        children: z.array(navLinkChildSchema).max(20, "下拉项过多").default([]),
      }),
    )
    .max(20, "导航项过多")
    .default([])
    .superRefine((links, context) => {
      links.forEach((link, index) => {
        if (link.href.length === 0 && link.children.length === 0) {
          context.addIssue({
            code: "custom",
            message: "导航地址或下拉项至少填写一项",
            path: [index, "href"],
          });
        }
      });
    }),
  commentProvider: z.string().trim().max(50, "评论服务名过长").default(""),
  commentConfig: z.record(z.string(), z.unknown()).default({}),
  friendPageTitle: z.string().trim().max(50, "友链页标题过长").default("友链"),
  friendPageDescription: z.string().trim().max(200, "友链页描述过长").default(""),
  friendShowCustomContent: z.coerce.boolean().default(true),
  friendShowComment: z.coerce.boolean().default(true),
  friendContactEmail: z
    .string()
    .trim()
    .max(200, "联系邮箱过长")
    .default("")
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, "联系邮箱格式不正确"),
  friendNotes: z
    .array(
      z.object({
        title: z.string().trim().min(1, "请填写注意事项标题").max(50, "注意事项标题过长"),
        content: z.string().trim().max(300, "注意事项说明过长").default(""),
      }),
    )
    .max(10, "注意事项过多")
    .default([]),
  sponsorUsage: z.string().trim().max(500, "打赏用途说明过长").default(""),
  sponsorShowList: z.coerce.boolean().default(true),
  bilibiliEnabled: z.coerce.boolean().default(true),
  bilibiliUid: z.string().trim().max(200, "UID 或空间链接过长").default(""),
  bilibiliPageTitle: z.string().trim().max(50, "哔哩哔哩页面标题过长").default("哔哩哔哩"),
  bilibiliPageDescription: z.string().trim().max(200, "哔哩哔哩页面描述过长").default(""),
  bilibiliItemsPerPage: z.coerce.number().int().min(6, "每页数量不能小于 6").max(60, "每页数量不能大于 60").default(24),
  bilibiliCacheMinutes: z.coerce.number().int().min(0, "缓存时长不能小于 0").max(1440, "缓存时长不能大于 1440").default(60),
  bilibiliShowStats: z.coerce.boolean().default(true),
  bangumiEnabled: z.coerce.boolean().default(true),
  bangumiUsername: z.string().trim().max(200, "Bangumi 用户名或主页地址过长").default(""),
  bangumiApiUrl: z.string().trim().max(500, "Bangumi API 地址过长").default(""),
  bangumiSubjectBaseUrl: z.string().trim().max(500, "Bangumi 条目地址过长").default(""),
  bangumiPageTitle: z.string().trim().max(50, "Bangumi 页面标题过长").default("番组计划"),
  bangumiPageDescription: z.string().trim().max(200, "Bangumi 页面描述过长").default(""),
  bangumiItemsPerPage: z.coerce.number().int().min(6, "每页数量不能小于 6").max(60, "每页数量不能大于 60").default(24),
  bangumiCacheMinutes: z.coerce.number().int().min(0, "缓存时长不能小于 0").max(1440, "缓存时长不能大于 1440").default(60),
  bangumiNsfwMode: z.enum(["off", "blur", "hide"]).default("hide"),
  vndbEnabled: z.coerce.boolean().default(true),
  vndbUserId: z.string().trim().max(200, "VNDB 用户 ID 或主页地址过长").default(""),
  vndbApiToken: z.string().trim().max(500, "VNDB API Token 过长").default(""),
  vndbApiUrl: z.string().trim().max(500, "VNDB API 地址过长").default(""),
  vndbVnBaseUrl: z.string().trim().max(500, "VNDB 条目地址过长").default(""),
  vndbPageTitle: z.string().trim().max(50, "VNDB 页面标题过长").default("VNDB"),
  vndbPageDescription: z.string().trim().max(200, "VNDB 页面描述过长").default(""),
  vndbItemsPerPage: z.coerce.number().int().min(6, "每页数量不能小于 6").max(60, "每页数量不能大于 60").default(24),
  vndbCacheMinutes: z.coerce.number().int().min(0, "缓存时长不能小于 0").max(1440, "缓存时长不能大于 1440").default(60),
  vndbNsfwMode: z.enum(["off", "blur", "hide"]).default("hide"),
  malEnabled: z.coerce.boolean().default(true),
  malUsername: z.string().trim().max(200, "MyAnimeList 用户名或主页地址过长").default(""),
  malClientId: z.string().trim().max(500, "MyAnimeList Client ID 过长").default(""),
  malApiUrl: z.string().trim().max(500, "MyAnimeList API 地址过长").default(""),
  malAnimeBaseUrl: z.string().trim().max(500, "MyAnimeList 动画地址过长").default(""),
  malMangaBaseUrl: z.string().trim().max(500, "MyAnimeList 漫画地址过长").default(""),
  malPageTitle: z.string().trim().max(50, "MyAnimeList 页面标题过长").default("MyAnimeList"),
  malPageDescription: z.string().trim().max(200, "MyAnimeList 页面描述过长").default(""),
  malItemsPerPage: z.coerce.number().int().min(6, "每页数量不能小于 6").max(60, "每页数量不能大于 60").default(24),
  malCacheMinutes: z.coerce.number().int().min(0, "缓存时长不能小于 0").max(1440, "缓存时长不能大于 1440").default(60),
  malNsfwMode: z.enum(["off", "blur", "hide"]).default("hide"),
  themeHue: z.coerce.number().int().min(0, "色相不能小于 0").max(360, "色相不能大于 360").default(165),
  themeMode: z.enum(["light", "dark", "system"]).default("system"),
  cardOpacity: z.coerce.number().min(0, "透明度不能小于 0").max(1, "透明度不能大于 1").default(0.6),
  bannerTitle: z.string().trim().max(100, "横幅标题过长").default(""),
  bannerSubtitle: z.string().trim().max(200, "横幅副标题过长").default(""),
  bannerSubtitles: z.array(z.string().trim().max(200, "副标题过长")).max(10, "轮播副标题过多").default([]),
  bannerImageDesktop: z.string().trim().max(500, "桌面横幅地址过长").default(""),
  bannerImageMobile: z.string().trim().max(500, "移动横幅地址过长").default(""),
  bannerVideoPoster: z.string().trim().max(500, "横幅视频封面地址过长").default(""),
  bannerWaves: z.coerce.boolean().default(true),
  wallpaperMode: z.enum(["banner", "overlay", "fullscreen", "none"]).default("banner"),
  bannerHeightHome: z.coerce.number().int().min(20, "首页横幅高度不能小于 20").max(100, "首页横幅高度不能大于 100").default(65),
  bannerHeightNonHome: z.coerce.number().int().min(20, "其他页面横幅高度不能小于 20").max(100, "其他页面横幅高度不能大于 100").default(45),
  overlayBlur: z.coerce.number().int().min(0, "模糊值不能小于 0").max(40, "模糊值不能大于 40").default(0),
  fullscreenBlur: z.coerce.number().int().min(0, "模糊值不能小于 0").max(40, "模糊值不能大于 40").default(0),
  typewriterEnabled: z.coerce.boolean().default(true),
  showLeftSidebar: z.coerce.boolean().default(true),
  showRightSidebar: z.coerce.boolean().default(true),
  authorName: z.string().trim().max(50, "作者名过长").default(""),
  authorBio: z.string().trim().max(200, "站长简介过长").default(""),
  authorAvatar: z.string().trim().max(500, "头像地址过长").default(""),
  announcementText: z.string().trim().max(500, "公告过长").default(""),
  siteStartDate: z.string().trim().max(20, "建站日期过长").default(""),
});
