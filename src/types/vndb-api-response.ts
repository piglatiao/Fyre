// VNDB 用户收藏接口响应：只声明页面实际使用的字段
export interface VndbApiResponse {
  results?: Array<{
    id?: string;
    vote?: number | null;
    started?: string | null;
    finished?: string | null;
    notes?: string | null;
    labels?: Array<{ label?: string }>;
    vn?: {
      id?: string;
      title?: string | null;
      alttitle?: string | null;
      released?: string | null;
      languages?: string[];
      platforms?: string[];
      rating?: number | null;
      votecount?: number | null;
      length?: number | null;
      length_minutes?: number | null;
      image?: {
        url?: string;
        thumbnail?: string;
        sexual?: number;
        violence?: number;
      } | null;
      developers?: Array<{ name?: string }>;
      tags?: Array<{ name?: string }>;
    } | null;
  }>;
  more?: boolean;
}
