// MyAnimeList 列表接口响应：动画与漫画共用同一结构
export interface MalApiResponse {
  data?: Array<{
    node?: {
      id?: number;
      title?: string;
      main_picture?: {
        medium?: string;
        large?: string;
      } | null;
      alternative_titles?: {
        synonyms?: string[];
        en?: string;
        ja?: string;
      } | null;
      mean?: number | null;
      media_type?: string;
      num_episodes?: number;
      num_chapters?: number;
      num_volumes?: number;
      start_date?: string;
      status?: string;
      start_season?: {
        year?: number;
        season?: string;
      } | null;
      genres?: Array<{ id?: number; name?: string }>;
    };
    list_status?: {
      status?: string;
      score?: number;
      updated_at?: string;
      start_date?: string;
      finish_date?: string;
      comments?: string;
      num_episodes_watched?: number;
      num_chapters_read?: number;
      num_volumes_read?: number;
    };
  }>;
  paging?: {
    next?: string | null;
    previous?: string | null;
  } | null;
}
