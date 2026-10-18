import { CircleAlert, Home } from "lucide-react";
import Link from "next/link";
import BannerPortal from "@/components/site/banner-portal";
import NotFoundTitle from "@/components/site/not-found-title";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import { createSiteServices } from "@/server/services/service-container";

// 前台 404：文章或页面不存在时展示（对齐官网 404 的卡片样式）
export default async function SiteNotFound() {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();

  return (
    <div className="card-base relative flex flex-col items-center overflow-hidden rounded-(--radius-large) px-6 py-16 text-center">
      <NotFoundTitle siteName={settings.siteName} />
      {/* 背景水印与角落装饰 */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-[8rem] leading-none font-black opacity-[0.06]"
      >
        404
      </span>
      <span aria-hidden className="pointer-events-none absolute right-6 bottom-6 opacity-[0.08]">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Zm3.2-.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm3 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm-3 3.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm3 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm4.3 9.9h6v-2.6a1.3 1.3 0 0 0-1.3-1.3h-3.4a1.3 1.3 0 0 0-1.3 1.3v2.6Zm-7.9-6.3h6.3v-1.6H6.6v1.6Zm0 3.6h6.3v-1.8H6.6v1.8Z" />
        </svg>
      </span>

      <div className="relative flex flex-col items-center">
        <CircleAlert aria-hidden className="size-10 text-(--primary)" />
        <p className="mt-4 text-6xl font-black tracking-tight text-(--primary) opacity-80">404</p>
        <h1 className="mt-3 text-2xl font-bold">页面未找到</h1>
        <p className="text-50 mt-2 text-sm">抱歉，您访问的页面不存在或已被移动。</p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-(--btn-content) px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Home aria-hidden className="size-4" />
          返回首页
        </Link>
      </div>
      <BannerPortal>
        <PageBannerOverlay title="404" />
      </BannerPortal>
    </div>
  );
}
