"use client";

import {
  Captions,
  CaptionsOff,
  ListMusic,
  Loader2,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useId, useRef } from "react";
import { formatDuration } from "@/lib/format-duration";
import { useMusicPlayerContext } from "./music-player-provider";

// 指针横向位置换算为 0-1 比例（进度条与音量条共用）
function ratioFromPointer(event: ReactPointerEvent<HTMLDivElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0) {
    return 0;
  }
  return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
}

// 播放器面板：封面、曲名、时间、音量、进度、控制行与播放列表抽屉
// 导航栏浮动面板与左侧栏「音乐」卡片共用本组件，播放状态来自 MusicPlayerProvider
export default function MusicPlayerPanel() {
  const player = useMusicPlayerContext();
  const {
    tracks,
    current,
    currentIndex,
    playing,
    loading,
    progress,
    duration,
    lyrics,
    activeLyricIndex,
    volume,
    muted,
    mode,
    playlistOpen,
    lyricsOpen,
  } = player;
  const lyricsDrawerId = useId();
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const lyricLineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const userScrollUntilRef = useRef(0);
  const resumeTimerRef = useRef(0);

  // 当前歌词行变化时自动居中；用户手动滚动后的三秒内暂停自动滚动
  useEffect(() => {
    if (!lyricsOpen || activeLyricIndex < 0 || Date.now() < userScrollUntilRef.current) {
      return;
    }
    const container = lyricContainerRef.current;
    const line = lyricLineRefs.current[activeLyricIndex];
    if (!container || !line) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({
      top: line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeLyricIndex, lyricsOpen]);

  // 清理歌词滚动恢复计时器
  useEffect(() => {
    return () => window.clearTimeout(resumeTimerRef.current);
  }, []);

  // 用户主动滚动后暂时停止自动居中，三秒后恢复跟随当前歌词
  function pauseLyricsAutoScroll(): void {
    userScrollUntilRef.current = Date.now() + 3000;
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      userScrollUntilRef.current = 0;
      const container = lyricContainerRef.current;
      const line = lyricLineRefs.current[activeLyricIndex];
      if (!container || !line) {
        return;
      }
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      container.scrollTo({
        top: line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }, 3000);
  }

  // 未配置曲目时整块不渲染（导航按钮同样隐藏）
  if (tracks.length === 0) {
    return null;
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercent = muted ? 0 : volume * 100;
  const cover = current?.coverUrl ?? "";

  const iconButtonClass =
    "p-2 active:scale-95 transition-colors text-neutral-600 dark:text-neutral-300 hover:text-(--primary)";

  return (
    <div className="relative w-full transition-all duration-300" role="region" aria-label="音乐">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="relative size-14 shrink-0">
          <div className="bg-(--primary)/10 relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-lg dark:border-neutral-700">
            <Music aria-hidden className="text-(--primary) absolute size-6 opacity-40" />
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链
              <img
                src={cover}
                alt=""
                className="animate-spin-slow relative z-10 size-full object-cover"
                style={{ animationPlayState: playing ? "running" : "paused" }}
              />
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-1">
            <h3 className="min-w-0 flex-1 truncate text-base leading-tight font-bold text-neutral-800 dark:text-neutral-100">
              {current?.title ?? "音乐"}
            </h3>
            {lyrics.length > 0 ? (
              <button
                type="button"
                onClick={player.toggleLyrics}
                title={lyricsOpen ? "关闭歌词" : "显示歌词"}
                aria-label={lyricsOpen ? "关闭歌词" : "显示歌词"}
                aria-expanded={lyricsOpen}
                aria-controls={lyricsDrawerId}
                className={
                  "flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors " +
                  (lyricsOpen
                    ? "text-(--primary)"
                    : "text-neutral-400 hover:text-(--primary) dark:text-neutral-500")
                }
              >
                {lyricsOpen ? (
                  <Captions aria-hidden className="size-5" />
                ) : (
                  <CaptionsOff aria-hidden className="size-5" />
                )}
              </button>
            ) : null}
          </div>
          <p className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {current ? current.artist || "未知歌手" : "暂未播放"}
          </p>
          <div className="flex h-5 items-center gap-3 text-neutral-400">
            <div className="flex h-full shrink-0 items-center gap-1 font-mono text-[10px]" aria-live="polite">
              <span>{formatDuration(progress)}</span>
              <span className="opacity-50" aria-hidden>
                /
              </span>
              <span>{formatDuration(duration)}</span>
            </div>
            <div className="ml-auto flex h-full items-center gap-1">
              <button
                type="button"
                onClick={player.toggleMute}
                title="音量"
                aria-label="音量"
                className="flex items-center rounded-md p-0.5 transition-colors hover:text-(--primary)"
              >
                {muted || volume === 0 ? (
                  <VolumeX aria-hidden className="size-4" />
                ) : (
                  <Volume2 aria-hidden className="size-4" />
                )}
              </button>
              <div
                role="slider"
                aria-label="音量"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volumePercent)}
                className="bg-neutral-300/50 dark:bg-neutral-500/40 relative ml-1 h-1 w-16 cursor-pointer touch-none rounded-full"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  player.setVolume(ratioFromPointer(event));
                }}
                onPointerMove={(event) => {
                  if (event.buttons === 1) {
                    player.setVolume(ratioFromPointer(event));
                  }
                }}
              >
                <div
                  className="bg-(--primary) absolute top-0 left-0 h-full rounded-full"
                  style={{ width: volumePercent + "%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-1">
        <div
          role="slider"
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          className="group bg-neutral-300/60 dark:bg-neutral-500/40 relative mt-2 mb-2 h-1 w-full cursor-pointer touch-none rounded-full"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            player.seekRatio(ratioFromPointer(event));
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) {
              player.seekRatio(ratioFromPointer(event));
            }
          }}
        >
          <div
            className="bg-(--primary) absolute top-0 left-0 h-full rounded-full transition-[width] duration-100"
            style={{ width: progressPercent + "%" }}
          />
          <div
            className="bg-(--primary) absolute top-1/2 -mt-1.5 -ml-1.5 size-3 scale-0 rounded-full shadow-sm ring-2 ring-white transition-transform duration-200 group-hover:scale-100 dark:ring-neutral-800"
            style={{ left: progressPercent + "%" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-1 select-none">
        <button
          type="button"
          onClick={player.cycleMode}
          title="切换播放模式"
          aria-label="切换播放模式"
          className="p-2 text-neutral-400 transition-colors hover:text-(--primary) active:scale-95"
        >
          {mode === "single" ? (
            <Repeat1 aria-hidden className="size-5" />
          ) : mode === "shuffle" ? (
            <Shuffle aria-hidden className="size-5" />
          ) : (
            <Repeat aria-hidden className="size-5" />
          )}
        </button>
        <button type="button" onClick={player.previous} title="上一首" aria-label="上一首" className={iconButtonClass}>
          <SkipBack aria-hidden className="size-6" />
        </button>
        <button
          type="button"
          onClick={player.toggle}
          title={playing ? "暂停" : "播放"}
          aria-label={playing ? "暂停" : "播放"}
          className="flex size-12 items-center justify-center rounded-full bg-(--btn-regular-bg) text-(--primary) transition-all duration-300 hover:bg-(--btn-regular-bg-hover) active:bg-(--btn-regular-bg-active)"
        >
          {playing ? (
            <Pause aria-hidden className="size-6" />
          ) : (
            <Play aria-hidden className="ml-0.5 size-6" />
          )}
        </button>
        <button type="button" onClick={player.next} title="下一首" aria-label="下一首" className={iconButtonClass}>
          <SkipForward aria-hidden className="size-6" />
        </button>
        <button
          type="button"
          onClick={player.togglePlaylist}
          title="列表"
          aria-label="列表"
          aria-expanded={playlistOpen}
          className={
            "p-2 transition-all duration-300 active:scale-95 " +
            (playlistOpen ? "text-(--primary)" : "text-neutral-400 hover:text-(--primary)")
          }
        >
          <ListMusic aria-hidden className="size-5" />
        </button>
      </div>

      <div
        id={lyricsDrawerId}
        className={
          "grid transition-all duration-300 ease-out motion-reduce:transition-none " +
          (lyricsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
        }
      >
        <div className="min-h-0 overflow-hidden" inert={!lyricsOpen}>
          <div className="mx-1 mt-2 border-t border-neutral-100 pt-2 dark:border-white/5">
            <div
              ref={lyricContainerRef}
              className="custom-scrollbar relative flex h-48 flex-col gap-1 overflow-y-auto px-2 py-20 text-center"
              role="listbox"
              aria-label="歌词"
              onWheel={pauseLyricsAutoScroll}
              onTouchStart={pauseLyricsAutoScroll}
            >
              {lyrics.length > 0 ? (
                lyrics.map((line, index) => (
                  <button
                    key={`${line.time}-${index}`}
                    ref={(node) => {
                      lyricLineRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={index === activeLyricIndex}
                    aria-label={`跳转到 ${formatDuration(line.time)}：${line.text}`}
                    onClick={() => player.seekTo(line.time)}
                    className={
                      "flex min-h-11 shrink-0 items-center justify-center rounded-lg px-2 py-1 text-sm leading-relaxed transition-colors " +
                      (index === activeLyricIndex
                        ? "bg-(--btn-regular-bg) font-bold text-(--primary)"
                        : "text-neutral-500 hover:bg-(--btn-plain-bg-hover) hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100")
                    }
                  >
                    <span className="text-balance">{line.text}</span>
                  </button>
                ))
              ) : (
                <div
                  className="flex h-full items-center justify-center text-sm text-neutral-400"
                  role="option"
                  aria-selected={false}
                >
                  暂无歌词
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          "grid transition-all duration-300 motion-reduce:transition-none " +
          (playlistOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
        }
      >
        <div className="min-h-0 overflow-hidden" inert={!playlistOpen}>
          <div className="mx-1 mt-2 border-t border-neutral-100 pt-2 dark:border-white/5">
            <div className="custom-scrollbar relative max-h-48 overflow-y-auto pr-1 pb-1" role="listbox" aria-label="列表">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => player.playTrack(index)}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className={
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors " +
                    (index === currentIndex
                      ? "text-(--primary)"
                      : "text-neutral-600 hover:bg-(--btn-plain-bg-hover) dark:text-neutral-300")
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{track.title}</span>
                  {track.artist ? (
                    <span className="shrink-0 text-xs opacity-60">{track.artist}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!loading}
        className={
          "absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px] transition-opacity duration-300 dark:bg-[#1e1e1e]/60 " +
          (loading ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        <Loader2 aria-hidden className="text-(--primary) size-8 animate-spin" />
      </div>
    </div>
  );
}
