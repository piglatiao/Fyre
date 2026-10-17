import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import MediaManager from "@/components/admin/media-manager";

export const metadata: Metadata = {
  title: "媒体库",
};

// 媒体库：上传、浏览与删除本机磁盘上的媒体文件
export default function AdminMediaPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader title="媒体库" description="上传图片与文件，支持复制访问地址；非 GIF 图片会自动转为 WebP。" />
      <MediaManager />
    </section>
  );
}
