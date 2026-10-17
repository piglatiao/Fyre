import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import DynamicsManager from "@/components/admin/dynamics-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "动态管理",
};

// 后台列表每页条数
const PAGE_SIZE = 10;

// 解析页码参数：非法值回退到第 1 页
function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// 动态管理：服务端取数后交给客户端管理器（列表、编辑、置顶、删除）
export default async function AdminDynamicsPage({ searchParams }: PageProps<"/admin/dynamics">) {
  const { page: pageParam } = await searchParams;
  const requestedPage = readPage(pageParam);
  const { adminDynamicService } = createSiteServices();
  let { items, total } = await adminDynamicService.list({ page: requestedPage, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // 删除导致页码越界时回落到最后一页，避免出现空白列表
  let page = Math.min(requestedPage, totalPages);
  if (items.length === 0 && total > 0 && requestedPage > totalPages) {
    page = totalPages;
    ({ items, total } = await adminDynamicService.list({ page, pageSize: PAGE_SIZE }));
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="动态管理"
        description="维护首页与「动态」页的短内容：支持 Markdown、配图、位置、置顶与定时发布。"
      />
      <DynamicsManager items={items} total={total} page={page} totalPages={totalPages} />
    </section>
  );
}