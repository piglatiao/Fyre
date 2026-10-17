import Link from "next/link";

// 标签胶囊：标签云用（名称 + 数量徽标，样式对齐官网 tag-item / tag-count-badge）
export default function TagChip({
  tag,
  count,
}: {
  tag: { name: string; slug: string };
  count?: number;
}) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="tag-item group items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
    >
      <span>{tag.name}</span>
      {typeof count === "number" ? (
        <span className="tag-count-badge min-w-[1.5rem] px-1.5 text-center text-xs font-bold">{count}</span>
      ) : null}
    </Link>
  );
}