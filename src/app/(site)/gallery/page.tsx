import type { Metadata } from "next";
import BannerPortal from "@/components/site/banner-portal";
import GalleryExplorer from "@/components/site/gallery-explorer";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "相册",
  description: "记录光影、旅途与值得收藏的瞬间",
};

// 相册列表页：相册数据来自后台，搜索与标签筛选在客户端即时完成
export default async function GalleryPage() {
  const { galleryService } = createSiteServices();
  const albums = await galleryService.listAlbums();

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <GalleryExplorer albums={albums} />
      <BannerPortal>
        <PageBannerOverlay title="相册" />
      </BannerPortal>
    </div>
  );
}
