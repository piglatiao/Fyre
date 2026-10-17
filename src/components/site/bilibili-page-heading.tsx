import BilibiliIcon from "./bilibili-icon";

// 哔哩哔哩页头：标题、描述与数据同步日期，结构对齐官网 page-heading
export default function BilibiliPageHeading({
  title,
  description,
  updatedLabel,
}: {
  title: string;
  description: string;
  updatedLabel: string;
}) {
  return (
    <div className="page-heading mb-6">
      <div className="page-icon" aria-hidden>
        <BilibiliIcon className="size-8" />
      </div>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <p className="page-updated">
        <span>数据更新日期</span>
        <span>{updatedLabel}</span>
      </p>
    </div>
  );
}
