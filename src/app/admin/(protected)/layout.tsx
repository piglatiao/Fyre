import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/server/auth/logout-action";
import { getAdminSession } from "@/server/auth/get-admin-session";
import AdminMobileNav from "@/components/admin/admin-mobile-nav";
import AdminSidebar from "@/components/admin/admin-sidebar";

// 后台第二道鉴权：即使 proxy 被绕过，这里也会做服务端会话校验
export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-theme flex min-h-screen bg-(--page-bg)">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-header sticky top-0 z-10 flex h-14 items-center justify-between border-b border-(--line-color) px-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <AdminMobileNav />
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">管理后台</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden max-w-40 truncate text-sm text-zinc-700 sm:inline dark:text-zinc-300">
              {session.user.nickname ?? session.user.name}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="btn-regular h-9 rounded-lg px-4 text-sm font-medium">
                退出
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
