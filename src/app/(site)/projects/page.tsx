import type { Metadata } from "next";
import BannerPortal from "@/components/site/banner-portal";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import ProjectsExplorer from "@/components/site/projects-explorer";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "项目",
  description: "这里展示我开发过的项目",
};

// 项目列表页：数据来自后台项目管理，搜索与状态筛选在客户端即时完成
export default async function ProjectsPage() {
  const { projectService } = createSiteServices();
  const projects = await projectService.listProjects();

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <ProjectsExplorer projects={projects} />
      <BannerPortal>
        <PageBannerOverlay title="项目" />
      </BannerPortal>
    </div>
  );
}
