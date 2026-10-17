import { Archive, CircleHelp, Clock3, Code2, Rocket } from "lucide-react";
import { getProjectStatusMeta } from "@/lib/project-status";

const iconMap = {
  planning: Clock3,
  developing: Code2,
  published: Rocket,
  archived: Archive,
} as const;

// 项目状态徽标：列表封面与详情页共用，未知状态使用中性问号图标
export default function ProjectStatusBadge({
  status,
  cover = false,
}: {
  status: string;
  cover?: boolean;
}) {
  const meta = getProjectStatusMeta(status);
  if (!meta.key) {
    return null;
  }
  const Icon = iconMap[meta.key as keyof typeof iconMap] ?? CircleHelp;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium backdrop-blur-md ${
        cover ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-lg"
      } ${cover ? meta.coverClassName : meta.className}`}
    >
      <Icon aria-hidden className={cover ? "size-3.5" : "size-5"} />
      {meta.label}
    </span>
  );
}
