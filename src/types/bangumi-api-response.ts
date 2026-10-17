// Bangumi 收藏接口响应：字段全部可选，便于兼容不同代理服务的轻微差异
export interface BangumiApiResponse {
  data?: Array<{
    subject_id?: number;
    subject_type?: number;
    rate?: number;
    type?: number;
    comment?: string | null;
    tags?: string[];
    ep_status?: number;
    vol_status?: number;
    updated_at?: string;
    subject?: {
      id?: number;
      name?: string;
      name_cn?: string;
      short_summary?: string;
      date?: string | null;
      eps?: number;
      volumes?: number;
      score?: number;
      rank?: number;
      collection_total?: number;
      nsfw?: boolean;
      images?: {
        large?: string;
        common?: string;
        medium?: string;
        small?: string;
        grid?: string;
      };
      tags?: Array<{ name?: string }>;
    } | null;
  }>;
  total?: number;
  limit?: number;
  offset?: number;
}
