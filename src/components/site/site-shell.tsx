"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { SiteSettings } from "@/types/site-settings";
import { POST_LIST_LAYOUT_INIT_SCRIPT } from "@/lib/post-list-layout";
import FloatingControls from "./floating-controls";
import BannerMedia from "./banner-media";
import BannerHomeOverlay from "./banner-home-overlay";
import HeaderWaves from "./header-waves";
import ScrollDownIndicator from "./scroll-down-indicator";

// 站点外壳：背景壁纸 + 吸顶导航 + 主栅格（左右侧栏）+ 页脚
// 首页显示完整 65vh 横幅与标题浮层，其余页面显示较矮的横幅
export default function SiteShell({
  settings,
  header,
  footer,
  sidebar,
  rightSidebar,
  children,
}: {
  settings: SiteSettings;
  header: ReactNode;
  footer: ReactNode;
  sidebar: ReactNode;
  rightSidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  // 文章详情页：官网在这类页面隐藏「站点统计 / 站点信息 / 日历」（widget-hide-on-post）
  const isPostPage = pathname.startsWith("/posts/");
  // 壁纸模式为 none 时不渲染横幅，内容直接顶到页面顶部
  const showWallpaper = settings.wallpaperMode !== "none";
  const [scrolled, setScrolled] = useState(false);

  // 滚动状态用于切换导航栏的玻璃质感
  useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > 16);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`site-wrapper${isHome ? " is-home" : ""}${isPostPage ? " is-post" : ""}`}
      data-scrolled={scrolled ? "true" : "false"}
      data-wallpaper={settings.wallpaperMode}
    >
      {/* 首屏内联脚本：尽早应用访客保存的文章列表布局偏好，避免列表布局跳变 */}
      <script dangerouslySetInnerHTML={{ __html: POST_LIST_LAYOUT_INIT_SCRIPT }} />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-(--btn-content) focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        跳到正文
      </a>

      <div id="wallpaper-wrapper" aria-hidden hidden={!showWallpaper}>
        <div id="wallpaper-gradient" className="wallpaper-default absolute inset-0" />
        {/* 封面兜底层：只做背景绘制（无动画/变换/滤镜），宿主回收视频或图片合成层后仍会绘制，避免横幅整块空白 */}
        {settings.bannerVideoPoster ? (
          <div
            id="wallpaper-poster"
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: `url("${settings.bannerVideoPoster}")` }}
          />
        ) : null}
        <BannerMedia
          desktopUrl={settings.bannerImageDesktop}
          mobileUrl={settings.bannerImageMobile}
          videoPoster={settings.bannerVideoPoster}
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/25" />
        {settings.bannerWaves ? <HeaderWaves /> : null}
        {isHome && showWallpaper ? <BannerHomeOverlay settings={settings} /> : null}
        {/* 非首页的横幅标题浮层挂载位（文章页、独立页面） */}
        <div id="banner-overlay-slot" className="absolute inset-0 z-20" />
      </div>

      {/* 向下滚动指示器：与官网一致，只在全屏壁纸模式的首页出现；
          放在壁纸容器外，避免全屏模式下 z-index: -1 的容器把指示器压到内容之下 */}
      {isHome && settings.wallpaperMode === "fullscreen" ? <ScrollDownIndicator /> : null}

      {header}

      <div className="content-panel">
        <div className="content-panel-inner">
          <div id="main-grid">
            <div id="left-sidebar-wrapper" hidden={!settings.showLeftSidebar}>
              <div id="left-sidebar" className="flex flex-col gap-4 pb-4">
                {sidebar}
              </div>
            </div>
            <div id="content-column" className="min-w-0">
              <main id="content">{children}</main>
            </div>
            <div id="right-sidebar-wrapper" hidden={!settings.showRightSidebar}>
              <div id="right-sidebar" className="flex flex-col gap-4 pb-4">
                {rightSidebar}
              </div>
              {/* 文章页目录等动态内容由客户端挂载到该插槽 */}
              <div id="right-sidebar-dynamic" className="flex flex-col gap-4" />
            </div>
          </div>
          {footer}
        </div>
      </div>

      <FloatingControls />
    </div>
  );
}
