import { okResponse } from "@/lib/api-response";
import { createMusicLyricsToken } from "@/server/auth/music-lyrics-token";
import { createSiteServices } from "@/server/services/service-container";
import type { MusicPlaylistResponse } from "@/types/music-playlist-response";

// 在线歌单接口：Meting 失败或为空时返回本地曲库，客户端无需感知具体错误
export async function GET(): Promise<Response> {
  const { settingService, metingMusicService, musicService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  if (settings.musicMode !== "meting") {
    return okResponse<MusicPlaylistResponse>({
      source: "local",
      tracks: await musicService.listPublic(),
    });
  }

  const remoteTracks = await metingMusicService.list(settings);
  if (remoteTracks.length === 0) {
    return okResponse<MusicPlaylistResponse>({
      source: "local",
      tracks: await musicService.listPublic(),
    });
  }

  const tracks = remoteTracks.map((track) => ({
    ...track,
    lyricsUrl: track.lyricsUrl
      ? `/api/music/lyrics?token=${encodeURIComponent(createMusicLyricsToken(track.lyricsUrl))}`
      : undefined,
  }));
  return okResponse<MusicPlaylistResponse>({ source: "meting", tracks });
}
