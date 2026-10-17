"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMusicPlayer } from "@/lib/use-music-player";
import type { MusicPlayerState } from "@/types/music-player-state";
import type { MusicTrack } from "@/types/music-track";

// 播放器上下文与读取 Hook 同文件（同一职责：共享播放状态）
const MusicPlayerContext = createContext<MusicPlayerState | null>(null);

// 音乐播放器容器：内部持有全站唯一的 audio 元素，导航浮动面板与侧栏卡片共用同一份状态
export default function MusicPlayerProvider({
  tracks,
  children,
}: {
  tracks: MusicTrack[];
  children: ReactNode;
}) {
  const player = useMusicPlayer(tracks);
  return <MusicPlayerContext.Provider value={player}>{children}</MusicPlayerContext.Provider>;
}

// 读取播放器状态：必须在 MusicPlayerProvider 内使用
export function useMusicPlayerContext(): MusicPlayerState {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error("useMusicPlayerContext 必须在 MusicPlayerProvider 内使用");
  }
  return context;
}
