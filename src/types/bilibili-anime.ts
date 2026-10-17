// 哔哩哔哩追番/追剧标准化条目
export interface BilibiliAnime {
  id: number;
  title: string;
  seasonType: number;
  seasonTypeName: string;
  poster: string | null;
  rating: number;
  ratingCount: number;
  summary: string;
  epStatus: string;
  link: string;
  releaseDate: string;
  tags: string[];
  viewCount: number;
  followCount: number;
  isFinished: boolean;
  progress: string;
}
