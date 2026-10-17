"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BANNER_VIDEO_STATE_EVENT,
  requestBannerVideoToggle,
  type BannerVideoStateDetail,
} from "@/lib/banner-video-events";

// 导航栏「背景视频」开关：与官网一致，md 及以上显示，控制横幅视频的播放与暂停
export default function BannerVideoToggle() {
  // 初始按播放中展示：横幅视频挂载后会自动播放并广播真实状态
  const [playing, setPlaying] = useState(true);

  // 订阅视频组件广播的播放状态，保持图标同步
  useEffect(() => {
    function onState(event: Event): void {
      const detail = (event as CustomEvent<BannerVideoStateDetail>).detail;
      if (detail) {
        setPlaying(detail.playing);
      }
    }
    window.addEventListener(BANNER_VIDEO_STATE_EVENT, onState);
    return () => window.removeEventListener(BANNER_VIDEO_STATE_EVENT, onState);
  }, []);

  const label = playing ? "暂停背景视频" : "播放背景视频";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={requestBannerVideoToggle}
      className="btn-plain hidden! h-11 w-11 rounded-lg md:flex!"
    >
      {playing ? (
        <Pause aria-hidden className="size-6" />
      ) : (
        <Play aria-hidden className="size-6" />
      )}
    </button>
  );
}