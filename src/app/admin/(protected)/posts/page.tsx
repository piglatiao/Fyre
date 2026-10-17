import type { Metadata } from "next";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/admin-page-header";
import PostsTable from "@/components/admin/posts-table";

export const metadata: Metadata = {
  title: "文章管理",
};

// 文章管理：筛选、批量删除与分页
export default function AdminPostsPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="文章管理"
        description="管理全部文章：筛选、编辑、定时发布与批量删除。"
        actions={
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            新建文章
          </Link>
        }
      />
      <PostsTable />
    </section>
  );
}
