import { BookOpen, Film, LibraryBig, type LucideIcon } from "lucide-react";
import type { MediaShelfSource } from "@/types/media-shelf-source";

const SOURCE_ICONS: Record<MediaShelfSource, LucideIcon> = {
  bangumi: Film,
  vndb: LibraryBig,
  mal: BookOpen,
};

// 媒体数据源图标：页头与骨架屏共用同一套视觉标识
export default function MediaSourceIcon({
  source,
  className,
}: {
  source: MediaShelfSource;
  className?: string;
}) {
  const Icon = SOURCE_ICONS[source];
  return <Icon aria-hidden className={className} />;
}
