import type { Metadata } from "next";
import { preload } from "react-dom";
import DevAutoReload from "@/components/dev-auto-reload";
import SettingsAutoSync from "@/components/site/settings-auto-sync";
import SiteFooter from "@/components/site/site-footer";
import SiteHeader from "@/components/site/site-header";
import MusicPlayerProvider from "@/components/site/music-player-provider";
import SakuraEffect from "@/components/site/sakura-effect";
import SiteShell from "@/components/site/site-shell";
import AnnouncementCard from "@/components/site/sidebar/announcement-card";
import CalendarCard from "@/components/site/sidebar/calendar-card";
import CategoriesCard from "@/components/site/sidebar/categories-card";
import LatestDynamicsCard from "@/components/site/sidebar/latest-dynamics-card";
import MusicPlayerCard from "@/components/site/sidebar/music-player-card";
import ProfileCard from "@/components/site/sidebar/profile-card";
import SiteInfoCard from "@/components/site/sidebar/site-info-card";
import SiteStatsCard from "@/components/site/sidebar/site-stats-card";
import TagsCard from "@/components/site/sidebar/tags-card";
import { resolveDevVersionStamp } from "@/lib/dev-version";
import { resolveSiteNavLinks } from "@/lib/site-nav";
import { createSiteServices } from "@/server/services/service-container";

// 前台元数据：站点名称、描述、关键词与图标均取自后台设置
export async function generateMetadata(): Promise<Metadata> {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  return {
    title: { default: settings.siteName, template: `%s · ${settings.siteName}` },
    description: settings.siteDescription,
    keywords: settings.seoKeywords.length > 0 ? settings.seoKeywords : undefined,
    icons: settings.siteFavicon
      ? { icon: settings.siteFavicon }
      : { icon: "/favicon/firefly-32.png", apple: "/favicon/firefly-32.png" },
  };
}

// 前台布局：壁纸横幅 + 吸顶导航 + 左右侧栏（资料/公告/分类/标签 + 最新动态/统计/站点信息）+ 页脚
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { settingService, categoryService, tagService, postService, dynamicService, musicService } = createSiteServices();
  const [settings, categories, tags, stats, latestDynamics, dynamicsCount, devStamp, settingsVersion, tracks] = await Promise.all([
    settingService.getSiteSettings(),
    categoryService.listAllWithCounts(),
    tagService.listAll(),
    postService.getSiteStats(),
    dynamicService.listRecent(2),
    dynamicService.count(),
    resolveDevVersionStamp(),
    settingService.getSettingsVersion(),
    musicService.listPublic(),
  ]);
  const navLinks = resolveSiteNavLinks(settings.navLinks);
  // 横幅封面预加载：让封面尽量跟上首次绘制（宿主把页面判为 hidden 时不会再有后续重绘）
  if (settings.bannerVideoPoster) {
    preload(settings.bannerVideoPoster, { as: "image", fetchPriority: "high" });
  }

  return (
    <MusicPlayerProvider tracks={tracks}>
      <SiteShell
        settings={settings}
        effects={settings.sakuraEnabled ? <SakuraEffect /> : null}
        header={<SiteHeader settings={settings} navLinks={navLinks} />}
        footer={<SiteFooter settings={settings} />}
        sidebar={
          <>
            <ProfileCard settings={settings} />
            <AnnouncementCard text={settings.announcementText} />
            {/* 音乐卡：无曲目时不渲染（与官网一致） */}
            {tracks.length > 0 ? <MusicPlayerCard /> : null}
            <CategoriesCard categories={categories} />
            <TagsCard tags={tags} />
          </>
        }
        rightSidebar={
          <>
            <LatestDynamicsCard entries={latestDynamics} total={dynamicsCount} />
            {/* 官网在文章详情页隐藏站点统计与站点信息；display:contents 让两张卡片仍是侧栏的 flex 子项，间距不变 */}
            <div className="widget-hide-on-post contents">
              <SiteStatsCard stats={stats} startDate={settings.siteStartDate} />
              <SiteInfoCard stats={stats} />
              {/* 日历卡：官网同样在文章详情页隐藏（widget-hide-on-post）；
                  移动端底部侧栏不含日历（官网 #mobile-bottom-sidebar），故 md 以下隐藏 */}
              <div className="hidden md:contents">
                <CalendarCard />
              </div>
            </div>
          </>
        }
      >
        <DevAutoReload stamp={devStamp} />
        <SettingsAutoSync version={settingsVersion} />
        {children}
      </SiteShell>
    </MusicPlayerProvider>
  );
}
