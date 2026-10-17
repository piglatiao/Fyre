// 空状态卡片：列表无数据时展示
export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card-base flex flex-col items-center gap-2 rounded-(--radius-large) px-6 py-12 text-center">
      <span aria-hidden className="mb-1 size-3 rounded-full bg-(--primary) opacity-70" />
      <p className="text-75 text-base font-bold">{title}</p>
      {description ? <p className="text-50 text-sm">{description}</p> : null}
    </div>
  );
}