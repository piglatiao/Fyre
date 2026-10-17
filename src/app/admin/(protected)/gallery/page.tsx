import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import GalleryManager from "@/components/admin/gallery-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "相册管理",
};

// 相册管理：服务端读取全部相册，客户端完成新增、编辑、启停与删除
export default async function AdminGalleryPage() {
  const { adminGalleryService } = createSiteServices();
  const albums = await adminGalleryService.listAll();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="相册管理"
        description="维护前台「我的 → 相册」：封面上传、照片列表、日期地点、标签、排序与独立访问密码。"
      />
      <GalleryManager albums={albums} />
    </section>
  );
}
