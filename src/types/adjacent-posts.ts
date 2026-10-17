import type { PostNeighbor } from "./post-neighbor";

// 文章上下篇导航
export interface AdjacentPosts {
  prev: PostNeighbor | null;
  next: PostNeighbor | null;
}
