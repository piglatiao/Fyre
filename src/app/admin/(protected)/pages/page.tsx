import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import PagesManager from "@/components/admin/pages-manager";

export const metadata: Metadata = {
  title: "页面管理",
};

// 页面管理：维护「关于」「友链」等独立页面
export default function AdminPagesPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader title="页面管理" description="维护关于、友链等独立页面，发布后可通过 /page/slug 访问。" />
      <PagesManager />
    </section>
  );
}
