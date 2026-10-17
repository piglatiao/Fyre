// 后台音乐曲目条目：含排序与创建时间
export interface AdminMusicTrackItem {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
  createdAt: Date;
}
