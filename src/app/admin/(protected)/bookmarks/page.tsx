import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import BookmarksManager from "@/components/admin/bookmarks-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "书签导航管理",
};

// 书签导航管理：分组与条目统一在后台维护
export default async function AdminBookmarksPage() {
  const { adminBookmarkService } = createSiteServices();
  const groups = await adminBookmarkService.listGroups();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="书签导航"
        description="维护前台「我的 → 书签导航」：分组、书签、图标、权重与启停状态。"
      />
      <BookmarksManager groups={groups} />
    </section>
  );
}
