import Link from "next/link";
import { isVideoUrl } from "@/lib/media-url";
import type { NavLink } from "@/types/nav-link";
import type { SiteSettings } from "@/types/site-settings";
import BannerVideoToggle from "./banner-video-toggle";
import DisplaySettings from "./display-settings";
import MobileNav from "./mobile-nav";
import MusicPlayerNav from "./music-player-nav";
import SiteNav from "./site-nav";
import SiteSearch from "./site-search";
import ThemeToggle from "./theme-toggle";

// 前台顶部导航：站点标识 + 桌面主导航 + 搜索 / 显示设置 / 移动端菜单
export default function SiteHeader({
  settings,
  navLinks,
}: {
  settings: SiteSettings;
  navLinks: NavLink[];
}) {
  // 横幅视频开关：仅当配置了视频壁纸且未关闭壁纸时显示（与官网一致，md 及以上）
  const bannerIsVideo = isVideoUrl(settings.bannerImageDesktop || settings.bannerImageMobile);
  return (
    <div id="top-row">
      <div id="navbar-wrapper">
        <div id="navbar" className="navbar-panel h-18 px-4">
          <div className="mx-auto grid h-full w-full max-w-(--page-width) grid-cols-[auto_minmax(0,1fr)_auto] items-center">
            <Link href="/" className="btn-plain h-13 min-w-0 rounded-lg px-3 font-bold md:px-5">
              <span className="flex items-center gap-2">
                {settings.siteLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 站点标识由后台配置任意地址
                  <img src={settings.siteLogo} alt="" className="size-7 shrink-0 object-contain" />
                ) : (
                  <span aria-hidden className="navbar-brand-logo size-7 shrink-0" />
                )}
                <span className="truncate text-base">{settings.siteName}</span>
              </span>
            </Link>

            <SiteNav items={navLinks} />

            <div className="col-start-3 flex items-center">
              <SiteSearch />
              <MusicPlayerNav />
              {settings.wallpaperMode !== "none" && bannerIsVideo ? <BannerVideoToggle /> : null}
              {/* key 绑定后台透明度：默认值被后台改动并同步刷新时重新挂载，重新读取访客偏好 */}
              <DisplaySettings
                key={String(settings.cardOpacity)}
                defaultCardOpacity={settings.cardOpacity}
              />
              <ThemeToggle />
              <MobileNav items={navLinks} siteName={settings.siteName} siteLogo={settings.siteLogo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
