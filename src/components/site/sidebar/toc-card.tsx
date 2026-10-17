import type { TocItem } from "@/types/toc-item";
import WidgetCard from "./widget-card";

// 文章目录卡（桌面端右侧栏）
export default function TocCard({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="目录">
      <nav aria-label="文章目录" className="toc-list">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} className={item.level === 3 ? "pl-6" : ""}>
            {item.text}
          </a>
        ))}
      </nav>
    </WidgetCard>
  );
}