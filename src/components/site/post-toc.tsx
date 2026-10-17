import type { TocItem } from "@/types/toc-item";

// 文章目录：锚点与正文标题 id 对应（与 rehype-slug 使用同一 slug 算法）
export default function PostToc({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="文章目录"
      className="rounded-2xl border border-stone-200 bg-white/70 p-4 dark:border-stone-800 dark:bg-stone-900/60"
    >
      <p className="mb-3 text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">目录</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className="block truncate text-stone-600 transition hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
