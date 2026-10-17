import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import CategoriesManager from "@/components/admin/categories-manager";

export const metadata: Metadata = {
  title: "分类管理",
};

// 分类管理：新增、编辑与带迁移的删除
export default function AdminCategoriesPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader title="分类管理" description="维护文章分类；删除非空分类时需先指定文章去向。" />
      <CategoriesManager />
    </section>
  );
}
