// 媒体收藏卡片统一数据：哔哩哔哩之外的媒体页共用同一套展示结构
export interface MediaShelfItem {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  link: string;
  categoryId: string;
  categoryLabel: string;
  statusKey: string;
  statusLabel: string;
  score: number;
  communityScore: number;
  scoreLabel: string;
  meta: string;
  progress: string;
  summary: string;
  tags: string[];
  sortDate: string;
  nsfw: boolean;
}
