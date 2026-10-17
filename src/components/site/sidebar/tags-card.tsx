import Link from "next/link";
import type { TagItem } from "@/types/tag-item";
import WidgetCard from "./widget-card";

// 标签卡：标签云，标注文章数量
export default function TagsCard({ tags, delay = 200 }: { tags: TagItem[]; delay?: number }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="标签" delay={delay}>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link key={tag.slug} href={`/tag/${tag.slug}`} className="tag-item px-2.5 py-1 text-xs font-medium">
            #{tag.name}
            <span className="ml-1 opacity-60">{tag.postCount}</span>
          </Link>
        ))}
      </div>
    </WidgetCard>
  );
}