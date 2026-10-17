// 哔哩哔哩内容类型对应的中文名称与角标配色
const SEASON_TYPE_META: Record<number, { label: string; badgeClass: string; dotClass: string }> = {
  1: { label: "番剧", badgeClass: "bg-blue-500", dotClass: "bg-blue-500" },
  2: { label: "电影", badgeClass: "bg-violet-500", dotClass: "bg-violet-500" },
  3: { label: "纪录片", badgeClass: "bg-emerald-500", dotClass: "bg-emerald-500" },
  4: { label: "国创", badgeClass: "bg-orange-500", dotClass: "bg-orange-500" },
  5: { label: "电视剧", badgeClass: "bg-pink-500", dotClass: "bg-pink-500" },
  7: { label: "演唱会", badgeClass: "bg-amber-500", dotClass: "bg-amber-500" },
};

// 读取类型信息：优先使用接口中文名，未知类型回退到通用样式
export function getBilibiliSeasonTypeMeta(
  seasonType: number,
  seasonTypeName?: string,
): { label: string; badgeClass: string; dotClass: string } {
  const fallback = SEASON_TYPE_META[seasonType] ?? {
    label: "影视",
    badgeClass: "bg-slate-500",
    dotClass: "bg-slate-500",
  };
  return seasonTypeName ? { ...fallback, label: seasonTypeName } : fallback;
}
