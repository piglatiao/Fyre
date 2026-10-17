import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Eye,
  FileEdit,
  FileText,
  Flame,
  FolderTree,
  ImageIcon,
  ImageOff,
  Lock,
  MessageSquare,
  MessagesSquare,
  Music,
  PenLine,
  Rocket,
  Settings2,
  HeartHandshake,
  Images,
  Link2,
  Bookmark,
} from "lucide-react";
import DashboardHero from "@/components/admin/dashboard-hero";
import DashboardModuleGrid from "@/components/admin/dashboard-module-grid";
import DashboardRecentPosts from "@/components/admin/dashboard-recent-posts";
import DashboardStatCard from "@/components/admin/dashboard-stat-card";
import DashboardStatusPanel from "@/components/admin/dashboard-status-panel";
import DashboardTrendChart from "@/components/admin/dashboard-trend-chart";
import { formatBytes } from "@/lib/format-bytes";
import { formatDate } from "@/lib/format-date";
import { createSiteServices } from "@/server/services/service-container";
import type { WallpaperMode } from "@/types/wallpaper-mode";

export const metadata: Metadata = {
  title: "仪表盘",
};

// 趋势图统计的天数
const TREND_DAYS = 30;
// 每次展示的最近文章数量
const RECENT_POST_LIMIT = 6;
// 每次展示的热门文章数量
const POPULAR_POST_LIMIT = 5;

// 壁纸模式的中文说明（与前台设置项一致）
const wallpaperModeLabels: Record<WallpaperMode, string> = {
  banner: "顶部横幅壁纸",
  overlay: "全屏背景（暗化模糊）",
  fullscreen: "全屏壁纸",
  none: "不使用壁纸",
};

// 默认主题模式的中文说明
const themeModeLabels: Record<string, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

// 仪表盘：站点速览 + 数据卡片 + 发布趋势 + 待办与运行状态
export default async function AdminDashboardPage() {
  const { adminDashboardService, settingService } = createSiteServices();
  const [stats, recentPosts, trend, settings, popularPosts, systemInfo] = await Promise.all([
    adminDashboardService.getStats(),
    adminDashboardService.listRecentPosts(RECENT_POST_LIMIT),
    adminDashboardService.getPublishTrend(TREND_DAYS),
    settingService.getSiteSettings(),
    adminDashboardService.listPopularPosts(POPULAR_POST_LIMIT),
    adminDashboardService.getSystemInfo(),
  ]);

  const averageViews = stats.postTotal > 0 ? Math.round(stats.totalViews / stats.postTotal) : 0;
  // 最近 7 天发布量：用于数据卡片迷你走势与本周徽标
  const weekCounts = trend.slice(-7).map((point) => point.count);
  const weekTotal = weekCounts.reduce((sum, count) => sum + count, 0);
  const quickLinks = [
    { href: "/admin/posts/new", label: "写文章", icon: PenLine, primary: true },
    { href: "/admin/media", label: "媒体库", icon: ImageIcon, primary: false },
    { href: "/admin/pages", label: "页面", icon: FileEdit, primary: false },
    { href: "/admin/settings", label: "站点设置", icon: Settings2, primary: false },
  ];
  const todos = [
    {
      icon: CalendarClock,
      label: "定时待发布",
      count: stats.scheduledCount,
      hint: stats.nextScheduledAt ? "最近一篇：" + formatDate(stats.nextScheduledAt) : "暂无定时任务",
      href: "/admin/posts",
    },
    {
      icon: MessagesSquare,
      label: "评论待审核",
      count: stats.modules.pendingCommentCount,
      hint:
        stats.modules.pendingCommentCount > 0
          ? "通过后才会在前台公开"
          : "没有等待审核的评论",
      href: "/admin/comments?status=PENDING",
    },
    {
      icon: FileEdit,
      label: "草稿待完善",
      count: stats.draftCount,
      hint: stats.draftCount > 0 ? "写完即可发布" : "没有未完成的草稿",
      href: "/admin/posts",
    },
    {
      icon: ImageOff,
      label: "缺少封面",
      count: stats.coverlessCount,
      hint: stats.coverlessCount > 0 ? "补封面后列表更整齐" : "全部文章都有封面",
      href: "/admin/posts",
    },
    {
      icon: Lock,
      label: "已加密文章",
      count: stats.encryptedCount,
      hint: stats.encryptedCount > 0 ? "需要密码才能阅读" : "暂未设置阅读密码",
      href: "/admin/posts",
    },
  ];
  const maxPopularViews = Math.max(1, ...popularPosts.map((post) => post.viewCount));
  const sidebarLayout =
    settings.showLeftSidebar || settings.showRightSidebar
      ? [settings.showLeftSidebar ? "左侧" : "", settings.showRightSidebar ? "右侧" : ""].filter(Boolean).join(" + ")
      : "全部隐藏";
  const siteFacts = [
    { label: "壁纸模式", value: wallpaperModeLabels[settings.wallpaperMode] },
    { label: "默认主题", value: themeModeLabels[settings.themeMode] ?? settings.themeMode },
    { label: "侧栏布局", value: sidebarLayout },
  ];
  const modules = [
    {
      href: "/admin/dynamics",
      label: "动态",
      value: stats.modules.dynamicCount,
      detail: "发布说说与图文短动态",
      icon: MessageSquare,
    },
    {
      href: "/admin/projects",
      label: "项目",
      value: stats.modules.projectCount,
      detail: "维护作品集与项目详情",
      icon: Rocket,
    },
    {
      href: "/admin/gallery",
      label: "相册",
      value: stats.modules.galleryAlbumCount,
      detail: stats.modules.galleryPhotoCount + " 张照片 · 支持独立密码",
      icon: Images,
    },
    {
      href: "/admin/friends",
      label: "友链",
      value: stats.modules.friendCount,
      detail: "管理朋友站点与权重",
      icon: Link2,
    },
    {
      href: "/admin/bookmarks",
      label: "书签",
      value: stats.modules.bookmarkCount,
      detail: stats.modules.bookmarkGroupCount + " 个分组 · 导航收藏",
      icon: Bookmark,
    },
    {
      href: "/admin/sponsors",
      label: "打赏",
      value: stats.modules.sponsorRecordCount,
      detail: stats.modules.sponsorMethodCount + " 种方式 · 支持者名单",
      icon: HeartHandshake,
    },
    {
      href: "/admin/music",
      label: "音乐",
      value: stats.modules.musicTrackCount,
      detail: "维护本地曲库与播放列表",
      icon: Music,
    },
    {
      href: "/admin/comments",
      label: "评论",
      value: stats.modules.commentCount,
      detail: stats.modules.pendingCommentCount + " 条待审核 · 站内数据库",
      icon: MessagesSquare,
    },
  ];

  return (
    <section className="space-y-6">
      <DashboardHero
        siteName={settings.siteName}
        siteDescription={settings.siteDescription || "在这里创作、整理与发布内容。"}
        summary={{
          posts: stats.postTotal,
          views: stats.totalViews,
          media: stats.mediaCount,
          pages: stats.pageCount,
          uptimeSeconds: systemInfo.uptimeSeconds,
        }}
        quickLinks={quickLinks}
      />

      {/* 核心数据 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          icon={FileText}
          label="文章总数"
          value={stats.postTotal}
          hint={"已发布 " + stats.publishedCount + " · 草稿 " + stats.draftCount + " · 定时 " + stats.scheduledCount + " · 私密 " + stats.privateCount}
          spark={weekCounts}
          badge={{ text: "本周 +" + weekTotal, tone: weekTotal > 0 ? "up" : "flat" }}
        />
        <DashboardStatCard
          icon={Eye}
          label="累计阅读"
          value={stats.totalViews}
          hint={"篇均 " + averageViews + " 次"}
          badge={{ text: "已发布 " + stats.publishedCount, tone: "flat" }}
        />
        <DashboardStatCard
          icon={FolderTree}
          label="分类 / 标签"
          value={stats.categoryCount + " / " + stats.tagCount}
          hint={"独立页面 " + stats.pageCount + " 个"}
        />
        <DashboardStatCard
          icon={ImageIcon}
          label="媒体文件"
          value={stats.mediaCount}
          hint={formatBytes(systemInfo.mediaBytes) + " · 数据库 " + formatBytes(systemInfo.databaseBytes)}
        />
      </div>

      <DashboardModuleGrid items={modules} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          {/* 发布趋势 */}
          <section className="admin-card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">发布趋势</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">按 Asia/Shanghai 统计最近 30 天</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="admin-chip">近 30 天</span>
                <Link
                  href="/admin/posts"
                  className="text-xs text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                >
                  全部文章
                </Link>
              </div>
            </div>
            <DashboardTrendChart points={trend} />
          </section>

          <DashboardRecentPosts posts={recentPosts} />
        </div>

        <div className="min-w-0 space-y-4">
          {/* 热门文章：按阅读量排行 */}
          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">热门文章</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">按阅读量排行</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-(--btn-regular-bg) text-(--primary)">
                <Flame className="size-4" aria-hidden />
              </span>
            </div>
            {popularPosts.length > 0 ? (
              <ul className="mt-4 space-y-3.5">
                {popularPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link href={"/admin/posts/" + post.id} className="group block">
                      <div className="flex items-center gap-2.5">
                        <span className={index < 3 ? "admin-rank top" : "admin-rank"}>{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm transition group-hover:text-(--primary)">
                          {post.title}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          {post.viewCount} 次
                        </span>
                      </div>
                      <div className="admin-meter mt-2 ml-8">
                        <span style={{ width: Math.max(6, Math.round((post.viewCount / maxPopularViews) * 100)) + "%" }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">还没有阅读数据。</p>
            )}
          </section>

          {/* 待办提醒 */}
          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">待办提醒</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">发布前的检查清单</p>
              </div>
              <Link href="/admin/posts" className="text-xs text-sky-600 transition hover:text-sky-700 dark:text-sky-400">
                去处理
              </Link>
            </div>
            <ul className="mt-3 space-y-1">
              {todos.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="admin-row flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--btn-regular-bg) text-(--primary)">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm">
                        {item.label}
                        <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-xs font-semibold text-(--primary)">
                          {item.count}
                        </span>
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.hint}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 站点外观速览 */}
          <section className="admin-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">站点外观</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">前台主题与壁纸</p>
              </div>
              <Link href="/admin/settings" className="text-xs text-sky-600 transition hover:text-sky-700 dark:text-sky-400">
                去配置
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-(--line-color) p-3">
              <span
                aria-hidden
                className="size-9 shrink-0 rounded-full shadow-inner ring-2 ring-white/60 dark:ring-white/10"
                style={{ background: "var(--primary)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">主题色相 {settings.themeHue}°</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  卡片透明度 {Math.round(settings.cardOpacity * 100)}%
                </p>
              </div>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              {siteFacts.map((fact) => (
                <div key={fact.label} className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">{fact.label}</dt>
                  <dd className="truncate font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <DashboardStatusPanel info={systemInfo} />
    </section>
  );
}
