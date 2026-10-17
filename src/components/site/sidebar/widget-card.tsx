import type { ReactNode } from "react";

// 侧栏组件统一容器：卡片外壳 + 主色竖条标题
export default function WidgetCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="card-base onload-animation rounded-(--radius-large) pb-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="widget-title">{title}</h2>
      <div className="overflow-hidden px-4">{children}</div>
    </section>
  );
}