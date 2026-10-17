import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import TagsManager from "@/components/admin/tags-manager";

export const metadata: Metadata = {
  title: "标签管理",
};

// 标签管理：新增、编辑、删除与合并
export default function AdminTagsPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader title="标签管理" description="维护文章标签，支持把重复标签合并到目标标签。" />
      <TagsManager />
    </section>
  );
}
