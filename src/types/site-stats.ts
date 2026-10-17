// 站点统计（前台侧栏展示）
export interface SiteStats {
  // 已发布文章数
  publishedCount: number;
  // 分类数
  categoryCount: number;
  // 标签数
  tagCount: number;
  // 全部文章阅读量合计
  totalViews: number;
  // 已发布文章正文字符数合计（「总字数」显示用）
  totalWords: number;
  // 最近一次文章更新时间
  latestUpdatedAt: Date | null;
}
