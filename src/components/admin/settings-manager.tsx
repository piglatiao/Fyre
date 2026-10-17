"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import { defaultNavLinks } from "@/lib/site-nav";
import type { NavLink } from "@/types/nav-link";
import type { NavLinkChild } from "@/types/nav-link-child";
import type { FriendPageNote } from "@/types/friend-page-note";
import type { SiteSettings } from "@/types/site-settings";
import type { SocialLink } from "@/types/social-link";
import MediaUrlField from "./media-url-field";

// 色相滑块轨道渐变（0-360）
const HUE_TRACK =
  "linear-gradient(to right, oklch(0.7 0.14 0), oklch(0.7 0.14 60), oklch(0.7 0.14 120), oklch(0.7 0.14 180), oklch(0.7 0.14 240), oklch(0.7 0.14 300), oklch(0.7 0.14 360))";

// 表单初值：与站点设置默认值保持一致
const emptySettings: SiteSettings = {
  siteName: "",
  siteSubtitle: "",
  siteDescription: "",
  siteLogo: "",
  siteFavicon: "",
  footerText: "",
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
  sponsorUsage: "",
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
  themeHue: 165,
  themeMode: "system",
  cardOpacity: 0.6,
  bannerTitle: "",
  bannerSubtitle: "",
  bannerSubtitles: [],
  bannerImageDesktop: "",
  bannerImageMobile: "",
  bannerVideoPoster: "",
  bannerWaves: true,
  wallpaperMode: "banner",
  bannerHeightHome: 65,
  bannerHeightNonHome: 45,
  overlayBlur: 0,
  fullscreenBlur: 0,
  typewriterEnabled: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  authorName: "",
  authorBio: "",
  authorAvatar: "",
  announcementText: "",
  siteStartDate: "",
};

// 站点设置：站点信息、导航、社交、备案、SEO 与站内评论配置
export default function SettingsManager() {
  const [form, setForm] = useState<SiteSettings>(emptySettings);
  const [keywordsText, setKeywordsText] = useState("");
  const [subtitlesText, setSubtitlesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 读取现有设置并回填表单
  useEffect(() => {
    void (async () => {
      const result = await requestJson<SiteSettings>("/api/settings");
      if (result.ok) {
        setForm(result.data);
        setKeywordsText(result.data.seoKeywords.join("\n"));
        setSubtitlesText(result.data.bannerSubtitles.join("\n"));
      } else {
        setMessage({ type: "error", text: result.error.message });
      }
      setLoading(false);
    })();
  }, []);

  // 保存设置：SEO 关键词与横幅副标题按行拆分后提交
  async function handleSubmit(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload: SiteSettings = {
      ...form,
      seoKeywords: keywordsText
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      bannerSubtitles: subtitlesText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    };
    const result = await requestJsonBody<{ updated: boolean }>("/api/settings", "PUT", payload);
    setSaving(false);
    if (result.ok) {
      setForm(payload);
      setMessage({ type: "success", text: "站点设置已保存" });
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 更新导航项
  function updateNavLink(index: number, next: NavLink): void {
    setForm((current) => ({
      ...current,
      navLinks: current.navLinks.map((item, position) => (position === index ? next : item)),
    }));
  }

  // 更新导航下拉子项
  function updateNavChild(linkIndex: number, childIndex: number, next: NavLinkChild): void {
    setForm((current) => ({
      ...current,
      navLinks: current.navLinks.map((item, position) =>
        position === linkIndex
          ? {
              ...item,
              children: item.children?.map((child, childPosition) =>
                childPosition === childIndex ? next : child,
              ),
            }
          : item,
      ),
    }));
  }

  // 为导航项添加下拉子项
  function addNavChild(linkIndex: number): void {
    setForm((current) => ({
      ...current,
      navLinks: current.navLinks.map((item, position) =>
        position === linkIndex
          ? { ...item, children: [...(item.children ?? []), { label: "", href: "" }] }
          : item,
      ),
    }));
  }

  // 移除导航下拉子项
  function removeNavChild(linkIndex: number, childIndex: number): void {
    setForm((current) => ({
      ...current,
      navLinks: current.navLinks.map((item, position) =>
        position === linkIndex
          ? { ...item, children: item.children?.filter((_, childPosition) => childPosition !== childIndex) }
          : item,
      ),
    }));
  }

  // 更新社交链接
  function updateSocialLink(index: number, next: SocialLink): void {
    setForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((item, position) => (position === index ? next : item)),
    }));
  }

  // 更新某条友链页注意事项
  function updateFriendNote(index: number, next: FriendPageNote): void {
    setForm((current) => ({
      ...current,
      friendNotes: current.friendNotes.map((item, position) => (position === index ? next : item)),
    }));
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">加载中…</p>;
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const cardClass = "space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
  const addButtonClass =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="status"
          className={
            message.type === "error"
              ? "rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">站点信息</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-site-name" className={labelClass}>
              站点名称
            </label>
            <input
              id="setting-site-name"
              value={form.siteName}
              onChange={(event) => setForm({ ...form, siteName: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-site-subtitle" className={labelClass}>
              副标题
            </label>
            <input
              id="setting-site-subtitle"
              value={form.siteSubtitle}
              onChange={(event) => setForm({ ...form, siteSubtitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-site-description" className={labelClass}>
              站点描述
            </label>
            <textarea
              id="setting-site-description"
              value={form.siteDescription}
              onChange={(event) => setForm({ ...form, siteDescription: event.target.value })}
              rows={2}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <MediaUrlField
            id="setting-site-logo"
            label="Logo 地址"
            value={form.siteLogo}
            onChange={(next) => setForm({ ...form, siteLogo: next })}
            placeholder="/uploads/… 或外部图片地址"
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <MediaUrlField
            id="setting-site-favicon"
            label="站点图标地址"
            value={form.siteFavicon}
            onChange={(next) => setForm({ ...form, siteFavicon: next })}
            placeholder="/favicon.ico"
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <div>
            <label htmlFor="setting-footer-text" className={labelClass}>
              页脚文案
            </label>
            <input
              id="setting-footer-text"
              value={form.footerText}
              onChange={(event) => setForm({ ...form, footerText: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-icp" className={labelClass}>
              备案号
            </label>
            <input
              id="setting-icp"
              value={form.icpNumber}
              onChange={(event) => setForm({ ...form, icpNumber: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">外观主题</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="setting-theme-hue" className={labelClass}>
              主题色相（0-360，决定全站主色与背景色调）
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                id="setting-theme-hue"
                type="range"
                min={0}
                max={360}
                step={1}
                value={form.themeHue}
                onChange={(event) => {
                  const hue = Number.parseInt(event.target.value, 10);
                  setForm({ ...form, themeHue: hue });
                  // 即时预览：色相写入全站变量
                  document.documentElement.style.setProperty("--hue", String(hue));
                }}
                className="h-2 w-full max-w-md cursor-pointer appearance-none rounded-full"
                style={{ background: HUE_TRACK }}
              />
              <span className="w-14 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {form.themeHue}°
              </span>
              <span
                aria-hidden
                className="size-6 shrink-0 rounded-full"
                style={{ backgroundColor: `oklch(0.7 0.14 ${form.themeHue})` }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="setting-theme-mode" className={labelClass}>
              默认主题模式
            </label>
            <select
              id="setting-theme-mode"
              value={form.themeMode}
              onChange={(event) =>
                setForm({ ...form, themeMode: event.target.value as SiteSettings["themeMode"] })
              }
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="system">跟随系统</option>
              <option value="light">亮色</option>
              <option value="dark">暗色</option>
            </select>
          </div>
          <div>
            <label htmlFor="setting-card-opacity" className={labelClass}>
              卡片透明度（0.2-1，越大越不透明）
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                id="setting-card-opacity"
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={form.cardOpacity}
                onChange={(event) => {
                  const opacity = Number.parseFloat(event.target.value);
                  setForm({ ...form, cardOpacity: opacity });
                  document.documentElement.style.setProperty("--card-transparent-opacity", String(opacity));
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700"
              />
              <span className="w-14 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {Math.round(form.cardOpacity * 100)}%
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="setting-wallpaper-mode" className={labelClass}>
              壁纸模式
            </label>
            <select
              id="setting-wallpaper-mode"
              value={form.wallpaperMode}
              onChange={(event) =>
                setForm({ ...form, wallpaperMode: event.target.value as SiteSettings["wallpaperMode"] })
              }
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="banner">顶部横幅壁纸</option>
              <option value="overlay">全屏背景（暗化模糊，内容浮于其上）</option>
              <option value="fullscreen">全屏壁纸（首页铺满一屏）</option>
              <option value="none">不使用壁纸</option>
            </select>
          </div>
          <div>
            <label htmlFor="setting-banner-height-home" className={labelClass}>
              首页横幅高度（20-100 vh）
            </label>
            <input
              id="setting-banner-height-home"
              type="number"
              min={20}
              max={100}
              value={form.bannerHeightHome}
              onChange={(event) =>
                setForm({ ...form, bannerHeightHome: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-banner-height-non-home" className={labelClass}>
              其他页面横幅高度（20-100 vh）
            </label>
            <input
              id="setting-banner-height-non-home"
              type="number"
              min={20}
              max={100}
              value={form.bannerHeightNonHome}
              onChange={(event) =>
                setForm({ ...form, bannerHeightNonHome: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-overlay-blur" className={labelClass}>
              全屏背景模式模糊（0-40 px）
            </label>
            <input
              id="setting-overlay-blur"
              type="number"
              min={0}
              max={40}
              value={form.overlayBlur}
              onChange={(event) => {
                const blur = Number.parseInt(event.target.value, 10) || 0;
                setForm({ ...form, overlayBlur: blur });
                document.documentElement.style.setProperty("--overlay-blur", `${blur}px`);
              }}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-fullscreen-blur" className={labelClass}>
              全屏壁纸模式模糊（0-40 px）
            </label>
            <input
              id="setting-fullscreen-blur"
              type="number"
              min={0}
              max={40}
              value={form.fullscreenBlur}
              onChange={(event) => {
                const blur = Number.parseInt(event.target.value, 10) || 0;
                setForm({ ...form, fullscreenBlur: blur });
                document.documentElement.style.setProperty("--fullscreen-blur", `${blur}px`);
              }}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="setting-typewriter"
              type="checkbox"
              checked={form.typewriterEnabled}
              onChange={(event) => setForm({ ...form, typewriterEnabled: event.target.checked })}
              className="size-4 rounded border-(--line-color) text-sky-600"
            />
            <label htmlFor="setting-typewriter" className="text-sm text-zinc-600 dark:text-zinc-300">
              副标题使用打字机效果
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="setting-left-sidebar"
              type="checkbox"
              checked={form.showLeftSidebar}
              onChange={(event) => setForm({ ...form, showLeftSidebar: event.target.checked })}
              className="size-4 rounded border-(--line-color) text-sky-600"
            />
            <label htmlFor="setting-left-sidebar" className="text-sm text-zinc-600 dark:text-zinc-300">
              显示左侧栏（资料 / 公告 / 分类 / 标签）
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="setting-right-sidebar"
              type="checkbox"
              checked={form.showRightSidebar}
              onChange={(event) => setForm({ ...form, showRightSidebar: event.target.checked })}
              className="size-4 rounded border-(--line-color) text-sky-600"
            />
            <label htmlFor="setting-right-sidebar" className="text-sm text-zinc-600 dark:text-zinc-300">
              显示右侧栏（最新文章 / 站点统计 / 站点信息）
            </label>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          色相与透明度会写入全站 CSS 变量并即时预览；壁纸模式、横幅高度与侧栏开关保存后对前台立即生效。
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">横幅与个人资料</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-banner-title" className={labelClass}>
              横幅标题（留空使用站点名称）
            </label>
            <input
              id="setting-banner-title"
              value={form.bannerTitle}
              onChange={(event) => setForm({ ...form, bannerTitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-banner-subtitle" className={labelClass}>
              横幅副标题（单条）
            </label>
            <input
              id="setting-banner-subtitle"
              value={form.bannerSubtitle}
              onChange={(event) => setForm({ ...form, bannerSubtitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-banner-subtitles" className={labelClass}>
              打字机轮播副标题（每行一条，填写后优先于单条副标题）
            </label>
            <textarea
              id="setting-banner-subtitles"
              value={subtitlesText}
              onChange={(event) => setSubtitlesText(event.target.value)}
              rows={3}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <MediaUrlField
            id="setting-banner-desktop"
            label="横幅壁纸（桌面端地址，支持图片/GIF/MP4/WebM，留空使用主题渐变）"
            value={form.bannerImageDesktop}
            onChange={(next) => setForm({ ...form, bannerImageDesktop: next })}
            placeholder="/uploads/… 或外部图片/视频地址"
            accept="image/*,video/mp4,video/webm"
            filter="ALL"
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <MediaUrlField
            id="setting-banner-mobile"
            label="横幅壁纸（移动端地址，支持图片/GIF/MP4/WebM）"
            value={form.bannerImageMobile}
            onChange={(next) => setForm({ ...form, bannerImageMobile: next })}
            placeholder="/uploads/… 或外部图片/视频地址"
            accept="image/*,video/mp4,video/webm"
            filter="ALL"
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <MediaUrlField
            id="setting-banner-poster"
            label="视频封面图（横幅为视频时先显示该图，加载完成后无缝切换，可留空）"
            value={form.bannerVideoPoster}
            onChange={(next) => setForm({ ...form, bannerVideoPoster: next })}
            placeholder="/uploads/… 或外部图片地址"
            hint="可从横幅视频一键抓帧生成封面；跨域视频请先在横幅壁纸字段点「转存到媒体库」再抓帧"
            frameGrabSource={form.bannerImageDesktop || form.bannerImageMobile}
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <div className="flex items-center gap-2">
            <input
              id="setting-banner-waves"
              type="checkbox"
              checked={form.bannerWaves}
              onChange={(event) => setForm({ ...form, bannerWaves: event.target.checked })}
              className="size-4 rounded border-(--line-color) text-sky-600"
            />
            <label htmlFor="setting-banner-waves" className="text-sm text-zinc-600 dark:text-zinc-300">
              显示横幅底部波浪动画
            </label>
          </div>
          <div>
            <label htmlFor="setting-site-start" className={labelClass}>
              建站日期（用于侧栏运行天数）
            </label>
            <input
              id="setting-site-start"
              type="date"
              value={form.siteStartDate}
              onChange={(event) => setForm({ ...form, siteStartDate: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-author-name" className={labelClass}>
              站长昵称（侧栏资料卡）
            </label>
            <input
              id="setting-author-name"
              value={form.authorName}
              onChange={(event) => setForm({ ...form, authorName: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <MediaUrlField
            id="setting-author-avatar"
            label="站长头像地址"
            value={form.authorAvatar}
            onChange={(next) => setForm({ ...form, authorAvatar: next })}
            placeholder="/uploads/… 或外部图片地址"
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <div className="sm:col-span-2">
            <label htmlFor="setting-author-bio" className={labelClass}>
              站长简介
            </label>
            <input
              id="setting-author-bio"
              value={form.authorBio}
              onChange={(event) => setForm({ ...form, authorBio: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-announcement" className={labelClass}>
              公告内容（每行一段，留空则不显示公告卡）
            </label>
            <textarea
              id="setting-announcement"
              value={form.announcementText}
              onChange={(event) => setForm({ ...form, announcementText: event.target.value })}
              rows={3}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">导航菜单</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  navLinks: defaultNavLinks.map((item) => ({
                    ...item,
                    children: item.children?.map((child) => ({ ...child })),
                  })),
                }))
              }
              className={addButtonClass}
            >
              载入官网分组
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({ ...current, navLinks: [...current.navLinks, { label: "", href: "" }] }))
              }
              className={addButtonClass}
            >
              <Plus aria-hidden className="size-3.5" />
              添加导航
            </button>
          </div>
        </div>
        {form.navLinks.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">未配置导航时前台展示默认菜单。</p>
        ) : (
          <div className="space-y-3">
            {form.navLinks.map((link, index) => (
              <div key={index} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    aria-label={`导航名称 ${index + 1}`}
                    value={link.label}
                    onChange={(event) => updateNavLink(index, { ...link, label: event.target.value })}
                    placeholder="名称"
                    className={`${inputClass} sm:w-44`}
                  />
                  <input
                    aria-label={`导航地址 ${index + 1}`}
                    value={link.href}
                    onChange={(event) => updateNavLink(index, { ...link, href: event.target.value })}
                    placeholder={link.children?.length ? "分组地址可留空" : "/archive"}
                    className={`${inputClass} sm:w-56`}
                  />
                  <button type="button" onClick={() => addNavChild(index)} className={addButtonClass}>
                    <Plus aria-hidden className="size-3.5" />
                    下拉项
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        navLinks: current.navLinks.filter((_, position) => position !== index),
                      }))
                    }
                    className="inline-flex items-center gap-1 text-sm text-red-600 transition hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    移除
                  </button>
                </div>
                {link.children && link.children.length > 0 ? (
                  <div className="mt-3 space-y-2 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800">
                    {link.children.map((child, childIndex) => (
                      <div key={childIndex} className="flex flex-wrap items-center gap-2">
                        <input
                          aria-label={`导航 ${index + 1} 下拉项名称 ${childIndex + 1}`}
                          value={child.label}
                          onChange={(event) =>
                            updateNavChild(index, childIndex, { ...child, label: event.target.value })
                          }
                          placeholder="下拉项名称"
                          className={`${inputClass} sm:w-44`}
                        />
                        <input
                          aria-label={`导航 ${index + 1} 下拉项地址 ${childIndex + 1}`}
                          value={child.href}
                          onChange={(event) =>
                            updateNavChild(index, childIndex, { ...child, href: event.target.value })
                          }
                          placeholder="/about"
                          className={`${inputClass} sm:w-56`}
                        />
                        <button
                          type="button"
                          onClick={() => removeNavChild(index, childIndex)}
                          className="inline-flex items-center gap-1 text-sm text-red-600 transition hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 aria-hidden className="size-3.5" />
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">社交链接</h2>
          <button
            type="button"
            onClick={() => setForm({ ...form, socialLinks: [...form.socialLinks, { label: "", url: "" }] })}
            className={addButtonClass}
          >
            <Plus aria-hidden className="size-3.5" />
            添加链接
          </button>
        </div>
        {form.socialLinks.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">暂无社交链接。</p>
        ) : (
          <div className="space-y-3">
            {form.socialLinks.map((link, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3">
                <input
                  aria-label={`社交名称 ${index + 1}`}
                  value={link.label}
                  onChange={(event) => updateSocialLink(index, { ...link, label: event.target.value })}
                  placeholder="GitHub"
                  className={`${inputClass} sm:w-48`}
                />
                <input
                  aria-label={`社交地址 ${index + 1}`}
                  value={link.url}
                  onChange={(event) => updateSocialLink(index, { ...link, url: event.target.value })}
                  placeholder="https://github.com/your-name"
                  className={`${inputClass} sm:w-64`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, socialLinks: form.socialLinks.filter((_, position) => position !== index) })
                  }
                  className="inline-flex items-center gap-1 text-sm text-red-600 transition hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 aria-hidden className="size-3.5" />
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">友链页面</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-friend-title" className={labelClass}>
              页面标题
            </label>
            <input
              id="setting-friend-title"
              value={form.friendPageTitle}
              onChange={(event) => setForm({ ...form, friendPageTitle: event.target.value })}
              placeholder="友链"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-friend-email" className={labelClass}>
              申请联系邮箱（留空则读取社交链接中的邮箱）
            </label>
            <input
              id="setting-friend-email"
              type="email"
              value={form.friendContactEmail}
              onChange={(event) => setForm({ ...form, friendContactEmail: event.target.value })}
              placeholder="hello@example.com"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-friend-description" className={labelClass}>
              页面描述
            </label>
            <input
              id="setting-friend-description"
              value={form.friendPageDescription}
              onChange={(event) => setForm({ ...form, friendPageDescription: event.target.value })}
              placeholder="这里是我的朋友们，欢迎互相访问交流"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.friendShowCustomContent}
              onChange={(event) => setForm({ ...form, friendShowCustomContent: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            显示友链申请指南
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.friendShowComment}
              onChange={(event) => setForm({ ...form, friendShowComment: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            显示评论区
          </label>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">申请注意事项</h3>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  friendNotes: [...current.friendNotes, { title: "", content: "" }],
                }))
              }
              className={addButtonClass}
            >
              <Plus aria-hidden className="size-3.5" />
              添加注意事项
            </button>
          </div>
          {form.friendNotes.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">暂无注意事项，可点击上方按钮添加。</p>
          ) : (
            <div className="space-y-3">
              {form.friendNotes.map((note, index) => (
                <div key={index} className="flex flex-wrap items-start gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <input
                    aria-label={`注意事项标题 ${index + 1}`}
                    value={note.title}
                    onChange={(event) => updateFriendNote(index, { ...note, title: event.target.value })}
                    placeholder="标题，例如：互换原则"
                    className={`${inputClass} sm:w-44`}
                  />
                  <input
                    aria-label={`注意事项说明 ${index + 1}`}
                    value={note.content}
                    onChange={(event) => updateFriendNote(index, { ...note, content: event.target.value })}
                    placeholder="说明内容"
                    className={`${inputClass} min-w-52 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        friendNotes: current.friendNotes.filter((_, position) => position !== index),
                      }))
                    }
                    className="inline-flex h-9 items-center gap-1 text-sm text-red-600 transition hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          申请指南会展示站点名称、描述、地址、头像和联系邮箱；可在上方站点信息与资料卡中维护对应内容。
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">打赏页面</h2>
        <div>
          <label htmlFor="setting-sponsor-usage" className={labelClass}>
            打赏用途说明
          </label>
          <textarea
            id="setting-sponsor-usage"
            value={form.sponsorUsage}
            onChange={(event) => setForm({ ...form, sponsorUsage: event.target.value })}
            rows={3}
            placeholder="您的打赏将用于……"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.sponsorShowList}
            onChange={(event) => setForm({ ...form, sponsorShowList: event.target.checked })}
            className="size-4 accent-(--primary)"
          />
          在前台显示打赏者列表
        </label>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          打赏方式、收款码和打赏记录请在侧栏「打赏」模块中维护。
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">哔哩哔哩追番</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.bilibiliEnabled}
              onChange={(event) => setForm({ ...form, bilibiliEnabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            启用前台页面
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-bilibili-title" className={labelClass}>
              页面标题
            </label>
            <input
              id="setting-bilibili-title"
              value={form.bilibiliPageTitle}
              onChange={(event) => setForm({ ...form, bilibiliPageTitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bilibili-uid" className={labelClass}>
              哔哩哔哩 UID 或空间链接
            </label>
            <input
              id="setting-bilibili-uid"
              value={form.bilibiliUid}
              onChange={(event) => setForm({ ...form, bilibiliUid: event.target.value })}
              placeholder="例如 38932988"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-bilibili-description" className={labelClass}>
              页面描述
            </label>
            <input
              id="setting-bilibili-description"
              value={form.bilibiliPageDescription}
              onChange={(event) => setForm({ ...form, bilibiliPageDescription: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bilibili-page-size" className={labelClass}>
              每页条目数（6-60）
            </label>
            <input
              id="setting-bilibili-page-size"
              type="number"
              min={6}
              max={60}
              value={form.bilibiliItemsPerPage}
              onChange={(event) =>
                setForm({ ...form, bilibiliItemsPerPage: Number.parseInt(event.target.value, 10) || 24 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bilibili-cache" className={labelClass}>
              服务端缓存分钟数（0 表示不缓存）
            </label>
            <input
              id="setting-bilibili-cache"
              type="number"
              min={0}
              max={1440}
              value={form.bilibiliCacheMinutes}
              onChange={(event) =>
                setForm({ ...form, bilibiliCacheMinutes: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.bilibiliShowStats}
              onChange={(event) => setForm({ ...form, bilibiliShowStats: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            在页面顶部显示总追番数与 Bilibili 均分
          </label>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          页面地址为 /bilibili；会同步读取追番与追剧收藏，接口异常时自动回退上次缓存。
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">番组计划 Bangumi</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.bangumiEnabled}
              onChange={(event) => setForm({ ...form, bangumiEnabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            启用前台页面
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-bangumi-title" className={labelClass}>
              页面标题
            </label>
            <input
              id="setting-bangumi-title"
              value={form.bangumiPageTitle}
              onChange={(event) => setForm({ ...form, bangumiPageTitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-user" className={labelClass}>
              用户名或个人主页地址
            </label>
            <input
              id="setting-bangumi-user"
              value={form.bangumiUsername}
              onChange={(event) => setForm({ ...form, bangumiUsername: event.target.value })}
              placeholder="例如 1143164"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-bangumi-description" className={labelClass}>
              页面描述
            </label>
            <input
              id="setting-bangumi-description"
              value={form.bangumiPageDescription}
              onChange={(event) => setForm({ ...form, bangumiPageDescription: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-api" className={labelClass}>
              API 根地址
            </label>
            <input
              id="setting-bangumi-api"
              value={form.bangumiApiUrl}
              onChange={(event) => setForm({ ...form, bangumiApiUrl: event.target.value })}
              placeholder="https://bgmapi.anibt.net"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-subject" className={labelClass}>
              条目详情地址
            </label>
            <input
              id="setting-bangumi-subject"
              value={form.bangumiSubjectBaseUrl}
              onChange={(event) => setForm({ ...form, bangumiSubjectBaseUrl: event.target.value })}
              placeholder="https://bgm.tv/subject"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-page-size" className={labelClass}>
              每页条目数（6-60）
            </label>
            <input
              id="setting-bangumi-page-size"
              type="number"
              min={6}
              max={60}
              value={form.bangumiItemsPerPage}
              onChange={(event) =>
                setForm({ ...form, bangumiItemsPerPage: Number.parseInt(event.target.value, 10) || 24 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-cache" className={labelClass}>
              服务端缓存分钟数（0 表示不缓存）
            </label>
            <input
              id="setting-bangumi-cache"
              type="number"
              min={0}
              max={1440}
              value={form.bangumiCacheMinutes}
              onChange={(event) =>
                setForm({ ...form, bangumiCacheMinutes: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-bangumi-nsfw" className={labelClass}>
              敏感内容处理
            </label>
            <select
              id="setting-bangumi-nsfw"
              value={form.bangumiNsfwMode}
              onChange={(event) => setForm({ ...form, bangumiNsfwMode: event.target.value as SiteSettings["bangumiNsfwMode"] })}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="off">不处理</option>
              <option value="blur">仅模糊封面</option>
              <option value="hide">隐藏条目</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          页面地址为 /bangumi；默认代理地址不可用时可在上方替换，接口异常会回退上次成功缓存。
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">VNDB 视觉小说</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.vndbEnabled}
              onChange={(event) => setForm({ ...form, vndbEnabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            启用前台页面
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-vndb-title" className={labelClass}>
              页面标题
            </label>
            <input
              id="setting-vndb-title"
              value={form.vndbPageTitle}
              onChange={(event) => setForm({ ...form, vndbPageTitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-user" className={labelClass}>
              VNDB 用户 ID 或主页地址
            </label>
            <input
              id="setting-vndb-user"
              value={form.vndbUserId}
              onChange={(event) => setForm({ ...form, vndbUserId: event.target.value })}
              placeholder="例如 u358128"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-vndb-description" className={labelClass}>
              页面描述
            </label>
            <input
              id="setting-vndb-description"
              value={form.vndbPageDescription}
              onChange={(event) => setForm({ ...form, vndbPageDescription: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-token" className={labelClass}>
              API Token（读取私密列表时填写）
            </label>
            <input
              id="setting-vndb-token"
              type="password"
              autoComplete="off"
              value={form.vndbApiToken}
              onChange={(event) => setForm({ ...form, vndbApiToken: event.target.value })}
              placeholder="公开列表可留空"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-api" className={labelClass}>
              API 根地址
            </label>
            <input
              id="setting-vndb-api"
              value={form.vndbApiUrl}
              onChange={(event) => setForm({ ...form, vndbApiUrl: event.target.value })}
              placeholder="https://api.vndb.org/kana"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-vn-base" className={labelClass}>
              条目详情地址
            </label>
            <input
              id="setting-vndb-vn-base"
              value={form.vndbVnBaseUrl}
              onChange={(event) => setForm({ ...form, vndbVnBaseUrl: event.target.value })}
              placeholder="https://vndb.org"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-page-size" className={labelClass}>
              每页条目数（6-60）
            </label>
            <input
              id="setting-vndb-page-size"
              type="number"
              min={6}
              max={60}
              value={form.vndbItemsPerPage}
              onChange={(event) =>
                setForm({ ...form, vndbItemsPerPage: Number.parseInt(event.target.value, 10) || 24 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-cache" className={labelClass}>
              服务端缓存分钟数（0 表示不缓存）
            </label>
            <input
              id="setting-vndb-cache"
              type="number"
              min={0}
              max={1440}
              value={form.vndbCacheMinutes}
              onChange={(event) =>
                setForm({ ...form, vndbCacheMinutes: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-vndb-nsfw" className={labelClass}>
              敏感内容处理
            </label>
            <select
              id="setting-vndb-nsfw"
              value={form.vndbNsfwMode}
              onChange={(event) => setForm({ ...form, vndbNsfwMode: event.target.value as SiteSettings["vndbNsfwMode"] })}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="off">不处理</option>
              <option value="blur">仅模糊封面</option>
              <option value="hide">隐藏条目</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          页面地址为 /vndb；API Token 只用于服务端读取私密列表，不会传入前台页面。
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">MyAnimeList</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.malEnabled}
              onChange={(event) => setForm({ ...form, malEnabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            启用前台页面
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="setting-mal-title" className={labelClass}>
              页面标题
            </label>
            <input
              id="setting-mal-title"
              value={form.malPageTitle}
              onChange={(event) => setForm({ ...form, malPageTitle: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-user" className={labelClass}>
              用户名或个人主页地址
            </label>
            <input
              id="setting-mal-user"
              value={form.malUsername}
              onChange={(event) => setForm({ ...form, malUsername: event.target.value })}
              placeholder="例如 cuteleaf"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="setting-mal-description" className={labelClass}>
              页面描述
            </label>
            <input
              id="setting-mal-description"
              value={form.malPageDescription}
              onChange={(event) => setForm({ ...form, malPageDescription: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-client" className={labelClass}>
              Client ID
            </label>
            <input
              id="setting-mal-client"
              autoComplete="off"
              value={form.malClientId}
              onChange={(event) => setForm({ ...form, malClientId: event.target.value })}
              placeholder="在 MyAnimeList 应用配置中创建"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-api" className={labelClass}>
              API 根地址
            </label>
            <input
              id="setting-mal-api"
              value={form.malApiUrl}
              onChange={(event) => setForm({ ...form, malApiUrl: event.target.value })}
              placeholder="https://api.myanimelist.net/v2"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-anime-base" className={labelClass}>
              动画条目详情地址
            </label>
            <input
              id="setting-mal-anime-base"
              value={form.malAnimeBaseUrl}
              onChange={(event) => setForm({ ...form, malAnimeBaseUrl: event.target.value })}
              placeholder="https://myanimelist.net/anime"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-manga-base" className={labelClass}>
              漫画条目详情地址
            </label>
            <input
              id="setting-mal-manga-base"
              value={form.malMangaBaseUrl}
              onChange={(event) => setForm({ ...form, malMangaBaseUrl: event.target.value })}
              placeholder="https://myanimelist.net/manga"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-page-size" className={labelClass}>
              每页条目数（6-60）
            </label>
            <input
              id="setting-mal-page-size"
              type="number"
              min={6}
              max={60}
              value={form.malItemsPerPage}
              onChange={(event) =>
                setForm({ ...form, malItemsPerPage: Number.parseInt(event.target.value, 10) || 24 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-cache" className={labelClass}>
              服务端缓存分钟数（0 表示不缓存）
            </label>
            <input
              id="setting-mal-cache"
              type="number"
              min={0}
              max={1440}
              value={form.malCacheMinutes}
              onChange={(event) =>
                setForm({ ...form, malCacheMinutes: Number.parseInt(event.target.value, 10) || 0 })
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="setting-mal-nsfw" className={labelClass}>
              敏感内容处理
            </label>
            <select
              id="setting-mal-nsfw"
              value={form.malNsfwMode}
              onChange={(event) => setForm({ ...form, malNsfwMode: event.target.value as SiteSettings["malNsfwMode"] })}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="off">不处理</option>
              <option value="blur">仅模糊封面</option>
              <option value="hide">隐藏条目</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          页面地址为 /myanimelist；会同时读取公开的动画与漫画列表，列表需保持公开状态。
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold">SEO 与评论</h2>
        <div>
          <label htmlFor="setting-keywords" className={labelClass}>
            SEO 关键词（每行一个，也可用逗号分隔）
          </label>
          <textarea
            id="setting-keywords"
            value={keywordsText}
            onChange={(event) => setKeywordsText(event.target.value)}
            rows={3}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.commentsEnabled}
              onChange={(event) => setForm({ ...form, commentsEnabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            启用站内评论
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.commentsRequireApproval}
              onChange={(event) => setForm({ ...form, commentsRequireApproval: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            提交后需审核
          </label>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          评论直接保存到本站数据库，默认显示在文章、相册、项目、页面、动态、留言、打赏与友链内容下方。
          开启审核后，新评论需在「评论管理」中通过才会公开。
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存设置"}
        </button>
      </div>
    </div>
  );
}
