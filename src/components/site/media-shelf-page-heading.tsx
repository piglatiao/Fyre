import type { MediaShelfSource } from "@/types/media-shelf-source";
import MediaSourceIcon from "./media-source-icon";

// 通用媒体页头：标题、描述与数据同步日期，结构与官网 page-heading 一致
export default function MediaShelfPageHeading({
  source,
  title,
  description,
  updatedLabel,
}: {
  source: MediaShelfSource;
  title: string;
  description: string;
  updatedLabel: string;
}) {
  return (
    <div className="page-heading mb-6">
      <div className="page-icon" aria-hidden>
        <MediaSourceIcon source={source} className="size-8" />
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
