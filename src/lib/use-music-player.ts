import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseLrc } from "@/lib/parse-lrc";
import type { MusicPlayMode } from "@/types/music-play-mode";
import type { MusicPlayerState } from "@/types/music-player-state";
import type { MusicTrack } from "@/types/music-track";

// 访客音量偏好存储键（与后台数据分离）
const VOLUME_STORAGE_KEY = "firefly-music-volume";
// 默认音量：与官网一致（70%）
const DEFAULT_VOLUME = 0.7;

// 读取本地音量偏好：不可用或非法时回退默认值
function readStoredVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }
  try {
    const stored = Number.parseFloat(window.localStorage.getItem(VOLUME_STORAGE_KEY) ?? "");
    return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

// 随机取一个不同于当前下标的曲目下标：只有一首时返回原下标
function pickShuffleIndex(length: number, currentIndex: number): number {
  if (length <= 1) {
    return currentIndex;
  }
  const next = Math.floor(Math.random() * (length - 1));
  return next >= currentIndex ? next + 1 : next;
}

// 音乐播放器状态机：单个 HTMLAudioElement + 本地曲库播放列表
// 音频元素是播放状态的事实来源，React 状态全部由音频事件或用户操作驱动
export function useMusicPlayer(tracks: MusicTrack[]): MusicPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 切歌后是否需要自动起播：由播放/切歌操作置位，音频地址更新后消费
  const autoPlayRef = useRef(false);
  // 连续加载失败计数：整列表都取不到音频时停止继续跳曲，避免死循环
  const failedCountRef = useRef(0);
  // 音频事件回调需要读取的最新值（事件订阅只挂一次）
  const latestRef = useRef({ mode: "list" as MusicPlayMode, tracksLength: tracks.length, currentIndex: 0 });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeValue] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<MusicPlayMode>("list");
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  // 在线歌词按曲目缓存：只接受与当前曲目 id 匹配的异步结果，避免切歌串词
  const [remoteLyrics, setRemoteLyrics] = useState<{ trackId: string; text: string } | null>(null);

  const current = tracks[currentIndex] ?? null;
  const lyricsText = current?.lyrics?.trim()
    ? current.lyrics
    : remoteLyrics?.trackId === current?.id
      ? remoteLyrics.text
      : "";
  const lyrics = useMemo(() => parseLrc(lyricsText), [lyricsText]);
  const activeLyricIndex = useMemo(() => {
    let index = -1;
    for (const [position, line] of lyrics.entries()) {
      if (progress + 0.12 >= line.time) {
        index = position;
      } else {
        break;
      }
    }
    return index;
  }, [lyrics, progress]);

  // 记录事件回调需要的最新播放模式、列表长度与下标
  useEffect(() => {
    latestRef.current = { mode, tracksLength: tracks.length, currentIndex };
  }, [mode, tracks.length, currentIndex]);

  // 切换曲目：重置进度与失败计数，并记录是否自动起播
  const selectIndex = useCallback((index: number, autoplay: boolean) => {
    autoPlayRef.current = autoplay;
    failedCountRef.current = 0;
    setCurrentIndex(index);
    setProgress(0);
    setDuration(0);
  }, []);

  // 按模式推算相邻曲目下标：随机模式随机换曲，其余按列表顺序
  const stepIndex = useCallback(
    (index: number, step: 1 | -1) => {
      const { mode: currentMode, tracksLength } = latestRef.current;
      if (tracksLength === 0) {
        return index;
      }
      if (currentMode === "shuffle") {
        return pickShuffleIndex(tracksLength, index);
      }
      return (index + step + tracksLength) % tracksLength;
    },
    [],
  );

  const playTrack = useCallback(
    (index: number) => {
      selectIndex(index, true);
    },
    [selectIndex],
  );

  const next = useCallback(() => {
    const { tracksLength, currentIndex: index } = latestRef.current;
    if (tracksLength > 0) {
      selectIndex(stepIndex(index, 1), true);
    }
  }, [selectIndex, stepIndex]);

  const previous = useCallback(() => {
    const { tracksLength, currentIndex: index } = latestRef.current;
    if (tracksLength > 0) {
      selectIndex(stepIndex(index, -1), true);
    }
  }, [selectIndex, stepIndex]);

  // 播放/暂停：尚未选曲时从第一首开始
  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (!current) {
      if (tracks.length > 0) {
        selectIndex(0, true);
      }
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [current, tracks.length, selectIndex]);

  // 按比例跳转播放进度
  const seekRatio = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    const clamped = Math.min(Math.max(ratio, 0), 1);
    audio.currentTime = clamped * audio.duration;
    setProgress(audio.currentTime);
  }, []);

  // 按秒跳转：歌词行点击使用，仍以 audio.duration 为边界
  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0 || !Number.isFinite(seconds)) {
      return;
    }
    const clamped = Math.min(Math.max(seconds, 0), audio.duration);
    audio.currentTime = clamped;
    setProgress(clamped);
  }, []);

  // 设置音量并写入本地存储；调到 0 时自动静音（界面数值由 volumechange 事件回填）
  const setVolume = useCallback((value: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(Math.max(value, 0), 1);
    if (audio) {
      audio.volume = clamped;
      audio.muted = clamped === 0;
    }
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {
      // 隐私模式下写入失败忽略即可
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
    }
  }, []);

  // 播放模式三态循环
  const cycleMode = useCallback(() => {
    setMode((value) => (value === "list" ? "single" : value === "single" ? "shuffle" : "list"));
  }, []);

  const togglePlaylist = useCallback(() => {
    setPlaylistOpen((value) => !value);
    setLyricsOpen(false);
  }, []);

  const toggleLyrics = useCallback(() => {
    if (lyrics.length === 0) {
      return;
    }
    setLyricsOpen((value) => !value);
    setPlaylistOpen(false);
  }, [lyrics.length]);

  // 在线歌词地址由服务端换取同源代理，客户端只请求本站地址，避免 CORS 失败影响播放
  useEffect(() => {
    const lyricsUrl = current?.lyricsUrl;
    if (!lyricsUrl) {
      return;
    }
    const controller = new AbortController();
    void fetch(lyricsUrl, { signal: controller.signal, headers: { accept: "text/plain" } })
      .then((response) => (response.ok ? response.text() : ""))
      .then((text) => {
        if (text.trim()) {
          setRemoteLyrics({ trackId: current.id, text });
        }
      })
      .catch(() => {
        // 歌词请求失败时保留无歌词状态，不干扰音频播放
      });
    return () => controller.abort();
  }, [current?.id, current?.lyricsUrl]);

  // 创建音频元素并订阅音频事件：进度、时长、缓冲、音量、播放结束与加载失败
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = readStoredVolume();
    audio.muted = audio.volume === 0;
    audioRef.current = audio;

    const handleVolumeChange = () => {
      setVolumeValue(audio.volume);
      setMuted(audio.muted);
    };
    const handleLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setLoading(false);
    };
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleWaiting = () => setLoading(true);
    const handlePlaying = () => {
      setLoading(false);
      setPlaying(true);
    };
    const handlePause = () => setPlaying(false);
    // 自然播放结束：单曲循环重播，其余按模式切换下一首
    const handleEnded = () => {
      const { mode: currentMode, tracksLength, currentIndex: index } = latestRef.current;
      if (currentMode === "single") {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      if (tracksLength > 0) {
        selectIndex(stepIndex(index, 1), true);
      }
    };
    // 音频地址失效等情况：自动跳到下一首，整列表都失败后停止播放
    const handleError = () => {
      const { tracksLength, currentIndex: index } = latestRef.current;
      failedCountRef.current += 1;
      if (failedCountRef.current >= Math.max(tracksLength, 1)) {
        setLoading(false);
        setPlaying(false);
        return;
      }
      selectIndex((index + 1) % Math.max(tracksLength, 1), true);
    };

    audio.addEventListener("volumechange", handleVolumeChange);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("durationchange", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    // 初始音量同步到界面（此时监听已就绪，volumechange 会触发一次）
    handleVolumeChange();

    return () => {
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("durationchange", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [selectIndex, stepIndex]);

  // 曲目变化：更新音频地址，并在需要时自动起播（只写外部音频元素，不在此处同步 setState）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) {
      return;
    }
    if (audio.getAttribute("src") !== current.audioUrl) {
      audio.src = current.audioUrl;
      audio.load();
    }
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      void audio.play().catch(() => {
        // 浏览器拦截或地址失效：错误由 error 事件兜底处理
      });
    }
  }, [current]);

  return {
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
    lyricsOpen: lyricsOpen && lyrics.length > 0,
    playTrack,
    toggle,
    previous,
    next,
    seekRatio,
    seekTo,
    setVolume,
    toggleMute,
    cycleMode,
    togglePlaylist,
    toggleLyrics,
  };
}
