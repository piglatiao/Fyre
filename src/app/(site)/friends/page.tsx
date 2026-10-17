import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import BannerPortal from "@/components/site/banner-portal";
import FriendFilter from "@/components/site/friend-filter";
import FriendGuide from "@/components/site/friend-guide";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteComments from "@/components/site/site-comments";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { getSiteUrl } from "@/lib/site-url";
import { createSiteServices } from "@/server/services/service-container";

// 友链页元数据：标题和描述来自后台设置
export async function generateMetadata(): Promise<Metadata> {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  return { title: settings.friendPageTitle, description: settings.friendPageDescription };
}

// 友链页：标题 + 搜索筛选 + 卡片网格 + 官网同款申请指南与评论区
export default async function FriendsPage() {
  const { friendService, settingService } = createSiteServices();
  const [items, settings] = await Promise.all([friendService.listEnabled(), settingService.getSiteSettings()]);
  const emailFromSocial = settings.socialLinks
    .map((link) => (link.url.startsWith("mailto:") ? link.url.slice("mailto:".length) : ""))
    .find((value) => value.length > 0);
  const contactEmail = settings.friendContactEmail || emailFromSocial || "";
  const avatarUrl = settings.authorAvatar || settings.siteLogo;

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      <div className="card-base mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-5">
          <div className="page-icon" aria-hidden>
            <UsersRound className="size-8" />
          </div>
          <div>
            <h1>{settings.friendPageTitle}</h1>
            <p>{settings.friendPageDescription} · {items.length} 位朋友</p>
          </div>
        </div>
        <FriendFilter items={items} />
      </div>
      {settings.friendShowCustomContent ? (
        <div className="card-base mb-4 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
          <FriendGuide
            siteName={settings.siteName}
            siteDescription={settings.siteDescription}
            siteUrl={getSiteUrl()}
            avatarUrl={avatarUrl}
            email={contactEmail}
            notes={settings.friendNotes}
          />
        </div>
      ) : null}
      {settings.friendShowComment ? (
        <SiteComments
          provider={settings.commentProvider}
          config={settings.commentConfig}
          path="/friends/"
          title={settings.friendPageTitle}
        />
      ) : null}
      <BannerPortal>
        <PageBannerOverlay title={settings.friendPageTitle} />
      </BannerPortal>
    </div>
  );
}
