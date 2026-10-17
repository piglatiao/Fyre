import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import BannerPortal from "@/components/site/banner-portal";
import BilibiliContent from "@/components/site/bilibili-content";
import BilibiliSkeleton from "@/components/site/bilibili-skeleton";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

// 页面元数据跟随后台配置，便于不同站点复用同一套功能
export async function generateMetadata(): Promise<Metadata> {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  return {
    title: settings.bilibiliPageTitle,
    description: settings.bilibiliPageDescription,
  };
}

// 哔哩哔哩收藏页：页头立即渲染，外部数据在 Suspense 中异步加载
export default async function BilibiliPage() {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  if (!settings.bilibiliEnabled) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <Suspense
        fallback={
          <BilibiliSkeleton
            title={settings.bilibiliPageTitle}
            description={settings.bilibiliPageDescription}
          />
        }
      >
        <BilibiliContent settings={settings} />
      </Suspense>
      <BannerPortal>
        <PageBannerOverlay title={settings.bilibiliPageTitle} />
      </BannerPortal>
    </div>
  );
}
