// 音乐曲目新增/编辑入参（后台表单与接口共用）
export interface MusicTrackUpsertInput {
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
}
