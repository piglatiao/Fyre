"use client";

import { Music } from "lucide-react";
import { useState } from "react";
import MusicPlayerPanel from "./music-player-panel";
import { useMusicPlayerContext } from "./music-player-provider";

// 导航栏音乐按钮 + 悬浮面板：位置与官网一致（搜索之后、背景视频开关之前）
export default function MusicPlayerNav() {
  const player = useMusicPlayerContext();
  const [open, setOpen] = useState(false);

  // 未配置曲目时按钮不渲染
  if (player.tracks.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="音乐"
        title="音乐"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="btn-plain h-11 w-11 rounded-lg"
      >
        <Music aria-hidden className="size-5" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="关闭音乐面板"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="float-panel absolute top-full right-0 z-50 mt-2 w-80 p-2 pt-4.5">
            <MusicPlayerPanel />
          </div>
        </>
      ) : null}
    </div>
  );
}
