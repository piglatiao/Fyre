// 哔哩哔哩追番接口返回的单条数据（仅声明页面实际使用的字段）
export interface BilibiliApiItem {
  media_id?: number;
  title?: string;
  cover?: string;
  season_type?: number;
  season_type_name?: string;
  season_id?: number;
  rating?: { score?: number; count?: number };
  evaluate?: string;
  summary?: string;
  brief?: string;
  new_ep?: { index_show?: string };
  publish?: { release_date?: string; pub_time?: string };
  styles?: string[];
  stat?: { view?: number; follow?: number };
  is_finish?: number;
  progress?: string;
}
