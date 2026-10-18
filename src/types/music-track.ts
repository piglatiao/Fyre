// 前台音乐曲目：本地曲目使用数字 id，在线曲目使用稳定的字符串 id
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  lyrics: string;
  // 在线歌词地址：服务端已换取同源代理地址，客户端不会直接跨域请求
  lyricsUrl?: string;
}
