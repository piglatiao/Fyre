import type { Metadata } from "next";
import AccountManager from "@/components/admin/account-manager";
import AdminPageHeader from "@/components/admin/admin-page-header";
import SettingsManager from "@/components/admin/settings-manager";
import { getAdminSession } from "@/server/auth/get-admin-session";

export const metadata: Metadata = {
  title: "站点设置",
};

// 站点设置：站点信息/导航/社交/SEO/评论预留，以及管理员账号与密码
export default async function AdminSettingsPage() {
  const session = await getAdminSession();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="站点设置"
        description="维护站点信息、导航菜单、社交链接、SEO 默认值与评论预留配置。"
      />
      <SettingsManager />
      <AccountManager
        username={session?.user.name ?? ""}
        nickname={session?.user.nickname ?? ""}
      />
    </section>
  );
}
