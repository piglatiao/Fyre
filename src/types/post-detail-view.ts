import type { AdjacentPosts } from "./adjacent-posts";
import type { PostDetail } from "./post-detail";
import type { TocItem } from "./toc-item";

// 文章详情视图：文章数据、渲染后的安全 HTML、目录与上下篇导航
export interface PostDetailView {
  post: PostDetail;
  html: string;
  toc: TocItem[];
  neighbors: AdjacentPosts;
}
