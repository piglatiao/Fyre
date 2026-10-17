// 前台音乐曲目：播放列表所需的公开字段
export interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
}
