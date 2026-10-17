import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import BannerPortal from "@/components/site/banner-portal";
import BookmarkBrowser from "@/components/site/bookmark-browser";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "书签导航",
  description: "收藏一些好用的网站，按分类整理",
};

// 书签导航页：分组、书签与图标全部来自数据库
export default async function BooknavPage() {
  const { bookmarkService } = createSiteServices();
  const groups = await bookmarkService.listGroups();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      <div className="card-base mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-4">
          <div className="page-icon" aria-hidden>
            <Bookmark className="size-8" />
          </div>
          <div>
            <h1>书签导航</h1>
            <p>收藏一些好用的网站，按分类整理 · {total} 个书签</p>
          </div>
        </div>
        <BookmarkBrowser groups={groups} />
      </div>
      <BannerPortal>
        <PageBannerOverlay title="书签导航" />
      </BannerPortal>
    </div>
  );
}
