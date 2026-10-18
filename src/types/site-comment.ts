// 前台公开评论：不包含邮箱等仅供后台使用的信息
export interface SiteComment {
  id: number;
  authorName: string;
  authorWebsite: string;
  content: string;
  html: string;
  createdAt: string;
}
