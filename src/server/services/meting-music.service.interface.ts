import type { MusicTrack } from "@/types/music-track";
import type { SiteSettings } from "@/types/site-settings";

// Meting 在线歌单服务：读取设置后依次尝试主 API 与备用 API
export interface MetingMusicService {
  list(settings: SiteSettings): Promise<MusicTrack[]>;
}
