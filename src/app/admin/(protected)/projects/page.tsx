import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import ProjectsManager from "@/components/admin/projects-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "项目管理",
};

// 项目管理：服务端读取全部项目，客户端完成新增、编辑、启停与删除
export default async function AdminProjectsPage() {
  const { adminProjectService } = createSiteServices();
  const projects = await adminProjectService.listAll();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="项目管理"
        description="维护前台「我的 → 项目」：封面、状态、标签、外链、排序与 Markdown 项目正文。"
      />
      <ProjectsManager projects={projects} />
    </section>
  );
}
