import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import FriendsManager from "@/components/admin/friends-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "友链管理",
};

// 友链管理：服务端读取全部记录，客户端完成新增、编辑、启停与删除
export default async function AdminFriendsPage() {
  const { adminFriendService } = createSiteServices();
  const items = await adminFriendService.listAll();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="友链管理"
        description="维护前台「社交 → 友链」页面，可上传头像、设置标签、权重与启停状态。"
      />
      <FriendsManager items={items} />
    </section>
  );
}
