import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import SponsorsManager from "@/components/admin/sponsors-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "打赏管理",
};

// 打赏管理：维护前台打赏方式与打赏记录
export default async function AdminSponsorsPage() {
  const { adminSponsorService } = createSiteServices();
  const [methods, records] = await Promise.all([
    adminSponsorService.listMethods(),
    adminSponsorService.listRecords(),
  ]);

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="打赏管理"
        description="维护前台「关于 → 打赏」：收款码、打赏链接、打赏记录与展示顺序。"
      />
      <SponsorsManager methods={methods} records={records} />
    </section>
  );
}
