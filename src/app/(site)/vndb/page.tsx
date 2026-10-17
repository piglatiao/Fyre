import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import BannerPortal from "@/components/site/banner-portal";
import MediaShelfSkeleton from "@/components/site/media-shelf-skeleton";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import VndbContent from "@/components/site/vndb-content";
import { createSiteServices } from "@/server/services/service-container";

// 页面元数据跟随后台配置，便于不同站点复用同一套媒体页
export async function generateMetadata(): Promise<Metadata> {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  return {
    title: settings.vndbPageTitle,
    description: settings.vndbPageDescription,
  };
}

// VNDB 收藏页：页头立即渲染，外部数据在 Suspense 中异步加载
export default async function VndbPage() {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  if (!settings.vndbEnabled) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <Suspense
        fallback={
          <MediaShelfSkeleton
            source="vndb"
            title={settings.vndbPageTitle}
            description={settings.vndbPageDescription}
          />
        }
      >
        <VndbContent settings={settings} />
      </Suspense>
      <BannerPortal>
        <PageBannerOverlay title={settings.vndbPageTitle} />
      </BannerPortal>
    </div>
  );
}
