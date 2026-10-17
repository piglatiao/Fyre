import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import BannerPortal from "@/components/site/banner-portal";
import MarkdownContent from "@/components/site/markdown-content";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteComments from "@/components/site/site-comments";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "留言",
  description: "欢迎在这里留下你的足迹，分享你的想法和建议",
};

// 留言页：介绍内容来自后台「页面」中的 guestbook，评论区沿用站点设置的挂载位
export default async function GuestbookPage() {
  const { pageService, settingService } = createSiteServices();
  const [view, settings] = await Promise.all([
    pageService.getPublishedBySlug("guestbook"),
    settingService.getSiteSettings(),
  ]);

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      <div className="card-base mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-6">
          <div className="page-icon" aria-hidden>
            <MessageCircle className="size-8" />
          </div>
          <div>
            <h1>留言</h1>
            <p>欢迎在这里留下你的足迹，分享你的想法和建议</p>
          </div>
        </div>
        {view ? (
          <MarkdownContent html={view.html} className="mt-2" />
        ) : (
          <ul className="ml-5 list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            <li>请保持友善和尊重，营造良好的交流氛围</li>
            <li>欢迎分享你的想法，也可以提出对网站的建议</li>
            <li>你的每一条留言都是对我最大的支持 ✨</li>
          </ul>
        )}
      </div>

      <SiteComments
        provider={settings.commentProvider}
        config={settings.commentConfig}
        path="/guestbook"
        title="留言"
      />

      <BannerPortal>
        <PageBannerOverlay title="留言" />
      </BannerPortal>
    </div>
  );
}
