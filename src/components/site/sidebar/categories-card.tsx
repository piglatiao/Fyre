import Link from "next/link";
import type { CategoryItem } from "@/types/category-item";
import WidgetCard from "./widget-card";

// 分类卡：分类名与已发布文章数量
export default function CategoriesCard({ categories, delay = 150 }: { categories: CategoryItem[]; delay?: number }) {
  if (categories.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="分类" delay={delay}>
      <ul className="flex flex-col gap-1">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="link-lg flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:text-(--primary) dark:text-neutral-300"
            >
              <span className="truncate">{category.name}</span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">{category.postCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}