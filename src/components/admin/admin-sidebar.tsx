import AdminNavLinks from "./admin-nav-links";

// 后台侧边导航：按当前路径高亮
export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar hidden w-56 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-(--line-color) px-5">
        <span aria-hidden className="admin-brand-dot size-5 shrink-0 rounded-full shadow-[0_0_12px_var(--primary)]" />
        <span className="text-base font-bold tracking-tight">流萤</span>
        <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-xs font-medium text-(--btn-content)">
          后台
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <AdminNavLinks />
      </nav>
    </aside>
  );
}
