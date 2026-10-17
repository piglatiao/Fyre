"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { reportBannerDebug } from "@/lib/banner-debug";
import { BANNER_VIDEO_TOGGLE_EVENT, publishBannerVideoState } from "@/lib/banner-video-events";

// 封面层样式：铺满壁纸容器，等价于 object-fit: cover + object-position: 0% 20%
const FRAME_CLASS = "banner-media-frame absolute inset-0 size-full";
const FRAME_STYLE: CSSProperties = {
  backgroundSize: "cover",
  backgroundPosition: "0% 20%",
  backgroundRepeat: "no-repeat",
};
// 自检与恢复阈值（毫秒）
const WATCH_INTERVAL_MS = 1000;
const FRAME_STALL_MS = 1500;
const RELOAD_AFTER_MS = 6000;
const REMOUNT_AFTER_MS = 15000;
const RENDER_GAP_MS = 1200;
// 判定“页面确实在屏幕上渲染”的窗口（毫秒）：rAF 在隐藏/被遮挡的标签页里会停摆
const RENDER_ACTIVE_MS = 2500;
const FLOW_RESET_MS = 10000;
const PLAY_RETRY_MS = 3000;
// 恢复节流与保活（毫秒）：交互信号可能很密集，恢复动作需要限速
const RECOVER_THROTTLE_MS = 1500;
// 封面动效与图层巡检（毫秒）：视频长时间出不了帧时给封面加慢速推移，并周期性重建图层栅格。
// 内置浏览器等宿主会把页面长期判为 hidden 且不投递可见性/交互事件，
// 定时器驱动的巡检是这类环境里唯一的自愈通道
const STUCK_ANIM_MS = 4000;
const LAYER_REPAIR_MS = 5000;
// 解码器假死兜底窗口（毫秒）：挂起恢复后元数据完好但帧号卡死时，给解码器这么久的观察期，
// 仍不出帧就直接重载元素（本机媒体带一年强缓存，重载不会重新下载）
const KICK_WINDOW_MS = 1300;

const KEEPALIVE_MS = 60000;

// 视频壁纸：封面兜底 + 三层恢复（催帧/播放 → 重载 → 重建元素）
// 宿主浏览器（内嵌浏览器 / 后台标签页）会在页面不可见时回收视频图层与解码器，
// 因此封面直接画在容器自身的背景上，视频只有确认出新帧后才淡入，任何时刻都不会出现空白横幅
export default function BannerVideo({
  src,
  className,
  poster,
}: {
  src: string;
  className: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // 封面容器：停滞动效与图层巡检都作用在它身上
  const frameRef = useRef<HTMLDivElement | null>(null);
  // 重建计数：解码器被宿主彻底回收后，只能换一个新的 video 元素恢复出画
  const [attempt, setAttempt] = useState(0);
  // 恢复额度：放在 ref 上跨 video 重建保留，避免重建后计数归零导致无限重载循环
  const budgetRef = useRef({ reloads: 0, remounts: 0, lastAttemptAt: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const supportsFrameCallback = typeof video.requestVideoFrameCallback === "function";
    let stopped = false;
    let revealed = false;
    let lastTime = -1;
    let lastProgressAt = Date.now();
    let lastFrameAt = Date.now();
    let lastRenderAt = Date.now();
    let flowSince = 0;
    let tickCount = 0;
    let lastPlayAttemptAt = 0;
    let lastRecoverAt = 0;

    let lastKeepaliveAt = Date.now();
    // 页面被挂起过（切标签页/渲染断档）：恢复流程据此决定是否重开一轮重试额度
    let suspendedFlag = false;
    // 上一次轮询到的隐藏状态：宿主切回标签页只更新状态、不派发事件时，靠它发现回到可见的时刻
    let hiddenFlag = false;
    // 用户经导航栏按钮手动暂停：暂停期间所有自动恢复流程静默，避免把视频又拉起来
    let userPaused = false;
    let rafId = 0;
    // 解码器假死兜底的定时器句柄（0 表示没有待执行任务）
    let kickTimer = 0;
    // 上一次图层巡检时间（毫秒时间戳，0 表示尚未巡检）
    let lastRepairAt = 0;
    const budget = budgetRef.current;

    // 恢复额度重置：连续出画较久后清空重载/重建次数，避免长时间挂机后额度耗尽
    const resetBudget = (now: number): void => {
      if (flowSince > 0 && now - flowSince >= FLOW_RESET_MS) {
        budget.reloads = 0;
        budget.remounts = 0;
        budget.lastAttemptAt = 0;
      }
    };

    // 布局可见性：display:none 时没有布局盒。
    // 刻意不依赖 document.visibilityState —— 内嵌浏览器切标签页后该状态可能长期停在 hidden，会把恢复流程锁死
    const layoutVisible = (): boolean => video.getClientRects().length > 0;

    // 页面是否处于隐藏态：隐藏期间浏览器会挂起媒体加载（切回前台才继续），
    // 此阶段的停滞属于浏览器行为而非故障
    const isPageHidden = (): boolean => document.visibilityState === "hidden";

    // 页面是否真的在渲染：rAF 持续回调说明画面确实在屏幕上。
    // 不能直接用 visibilityState 当恢复门槛：内置浏览器里该状态会长期停在 hidden，
    // 用它会把重载/重建彻底锁死；而真正隐藏的标签页里 rAF 会停摆，两者天然可区分
    const renderActive = (now: number): boolean => now - lastRenderAt < RENDER_ACTIVE_MS;

    // 视频层淡入：只有合成器确认拿到新帧后才让它盖住封面
    const reveal = (): void => {
      if (revealed) {
        return;
      }
      revealed = true;
      video.style.opacity = "1";
      reportBannerDebug("reveal", video);
    };

    // 视频层淡出：重新交给封面兜底
    const cover = (): void => {
      if (!revealed) {
        return;
      }
      revealed = false;
      video.style.opacity = "0";
      reportBannerDebug("cover", video);
    };

    // 继续播放：源选择失败（NETWORK_NO_SOURCE）时在恢复额度内先重载一次——
    // load() 会重置元素状态并重新选择源，这是切回前台后从“源已失效”恢复的唯一途径；
    // 播放尝试按固定间隔节流，避免宿主拦截自动播放时每秒重试刷屏
    const ensurePlaying = (): void => {
      if (stopped || userPaused || !video.paused) {
        return;
      }
      const now = Date.now();
      if (now - lastPlayAttemptAt < PLAY_RETRY_MS) {
        return;
      }
      lastPlayAttemptAt = now;
      if (video.networkState === 3 && video.readyState === 0 && budget.reloads < 3) {
        budget.reloads += 1;
        budget.lastAttemptAt = now;
        reportBannerDebug("reload:dead-source", video);
        cover();
        video.load();
      }
      void video.play().then(
        () => reportBannerDebug("play-ok", video),
        () => reportBannerDebug("play-fail", video),
      );
    };

    // 强制重建视频图层：窗口重新可见后合成器可能丢掉视频图层，微调位移让它重新提交
    const forceRepaint = (): void => {
      video.style.transform = "translateZ(0)";
      window.requestAnimationFrame(() => {
        video.style.transform = "";
      });
    };

    // 强制重绘整个图层：让合成器重新栅格化封面背景，修复“视频图层丢失后横幅一直空白”
    const forceReraster = (): void => {
      const frame = video.parentElement;
      if (!frame) {
        return;
      }
      frame.style.opacity = "0.999";
      window.requestAnimationFrame(() => {
        frame.style.opacity = "";
      });
    };

    // 封面慢速推移开关：视频长时间没有新帧时打开（横幅保持动态观感），恢复出帧后关闭
    const setStuck = (value: boolean): void => {
      const frame = frameRef.current;
      if (!frame) {
        return;
      }
      if (value === (frame.dataset.stuck === "true")) {
        return;
      }
      if (value) {
        frame.dataset.stuck = "true";
      } else {
        delete frame.dataset.stuck;
      }
      reportBannerDebug(value ? "stuck:on" : "stuck:off", video);
    };

    // 微调播放位置：让解码器立刻产出新帧
    const nudgeFrame = (): void => {
      if (video.readyState < 2) {
        return;
      }
      try {
        video.currentTime = video.currentTime;
      } catch {
        // 无源数据时禁止 Seek，忽略即可
      }
    };

    // 解码器假死兜底：挂起恢复后元数据可能完好（readyState=4）且视频不在暂停态，
    // 但解码器不再产出新帧（帧号卡死），此时 seek/重绘都无效，只能重载元素重新选源解码。
    // 先给一个短观察窗口，期间正常出帧就跳过，避免每次切标签页都重载媒体
    const scheduleKick = (): void => {
      if (kickTimer !== 0 || stopped || userPaused) {
        return;
      }
      kickTimer = window.setTimeout(() => {
        kickTimer = 0;
        if (stopped || !layoutVisible() || !renderActive(Date.now())) {
          return;
        }
        if (Date.now() - lastFrameAt < KICK_WINDOW_MS) {
          return;
        }
        budget.lastAttemptAt = Date.now();
        reportBannerDebug("kick:reload", video);
        cover();
        video.load();
        ensurePlaying();
      }, KICK_WINDOW_MS);
    };

    // 从后台恢复（含用户回到页面后的交互信号）：重置重试额度，必要时重建图层并重新加载媒体。
    // 注意：内置浏览器切标签页后 visibilityState 会长期停在 hidden 且不投递事件，
    // 所以恢复流程不依赖可见性判断，由交互信号与自检保活来驱动
    const recover = (reason: string): void => {
      if (stopped || userPaused || !layoutVisible()) {
        return;
      }
      const now = Date.now();
      // 交互信号可能很密集：限速，避免反复触发重绘
      if (now - lastRecoverAt < RECOVER_THROTTLE_MS) {
        return;
      }
      lastRecoverAt = now;
      // 只有确实被挂起过再回来（切标签页、渲染心跳断档）才重开一轮重试额度：
      // 用鼠标移动这类高频交互信号不断续额度会退化成无意义的重载循环；
      // NETWORK_NO_SOURCE 也能通过 load() 重新选择源，所以同样重开额度
      const resumed = suspendedFlag;
      suspendedFlag = false;
      if (resumed) {
        budget.reloads = 0;
        budget.remounts = 0;
        budget.lastAttemptAt = 0;
      }
      // 刚回到前台时 lastFrameAt 可能停留在几分钟前：先重置宽限期，
      // 让解码先跑满一个观察窗口，避免一回来就立刻升级重载/重建
      if (reason !== "activity" && !isPageHidden() && now - lastFrameAt >= FRAME_STALL_MS) {
        lastFrameAt = now;
        lastProgressAt = now;
      }
      if (now - lastFrameAt < FRAME_STALL_MS) {
        // 画面仍在推进：最多让合成器重新提交一次图层，不打断播放
        if (reason !== "activity") {
          forceRepaint();
        }
        ensurePlaying();
        return;
      }
      cover();
      forceRepaint();
      forceReraster();
      // 隐藏状态下媒体加载会被浏览器推迟到切回才开始：还没有元数据时主动重新加载（3 秒节流）
      if (video.readyState === 0 && now - lastPlayAttemptAt >= PLAY_RETRY_MS) {
        lastPlayAttemptAt = now;
        budget.lastAttemptAt = now;
        reportBannerDebug("recover:load", video);
        video.load();
      }
      ensurePlaying();
      nudgeFrame();
      // 假死兜底：观察窗口内仍不出帧就重载元素，不必等到 6 秒后的 watchdog 升级
      scheduleKick();
      reportBannerDebug(`recover:${reason}`, video);
    };

    // 帧呈现回调：有新帧送进合成器才说明画面可用
    const onFrame: VideoFrameRequestCallback = () => {
      const now = Date.now();
      lastFrameAt = now;
      if (flowSince === 0) {
        flowSince = now;
      }
      // 只有真正有解码帧（readyState≥2）时才淡入，避免无源状态下露出黑帧
      if (video.readyState >= 2 && !video.paused) {
        reveal();
      }
      if (!stopped) {
        video.requestVideoFrameCallback(onFrame);
      }
    };

    // 媒体出错：记录并交给自检流程恢复
    const onMediaError = (): void => {
      reportBannerDebug("media-error", video);
    };

    // 自检：暂停、进度不推进、长时间没有新帧，逐级恢复
    const watchdog = window.setInterval(() => {
      if (stopped || userPaused || !layoutVisible()) {
        return;
      }
      const now = Date.now();
      // 可见性轮询兜底：个别宿主切回标签页后不派发 visibilitychange，只更新状态。
      // 每秒比对一次，从隐藏回到可见时立即按“恢复”处理（清空节流并重新加载媒体）
      const pageHiddenNow = isPageHidden();
      if (hiddenFlag && !pageHiddenNow) {
        hiddenFlag = false;
        suspendedFlag = true;
        revive("poll");
      } else {
        hiddenFlag = pageHiddenNow;
      }
      // rAF 最近一次回调时间：诊断用（宿主把页面判为 hidden 时 rAF 可能仍在跑，用它区分“没渲染”与“渲染了但不出帧”）
      video.dataset.rafAt = String(lastRenderAt);
      if (!video.paused && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        lastProgressAt = now;
        if (!supportsFrameCallback) {
          // 无帧回调能力时，以播放进度推进当作“有画面”
          lastFrameAt = now;
          if (flowSince === 0) {
            flowSince = now;
          }
        }
      }
      const framesFlowing = supportsFrameCallback
        ? now - lastFrameAt < FRAME_STALL_MS
        : !video.paused && now - lastProgressAt < FRAME_STALL_MS;
      if (framesFlowing) {
        resetBudget(now);
        setStuck(false);
        if (video.readyState >= 2) {
          reveal();
        }
      } else {
        flowSince = 0;
        cover();
        const stallFor = now - lastFrameAt;
        // 停滞够久就让封面自己动起来：视频图层被宿主回收时，横幅仍是缓动的壁纸而不是死图
        if (stallFor >= STUCK_ANIM_MS) {
          setStuck(true);
        }
        // 图层巡检：页面确实在渲染（rAF 有回调）却长时间没有新帧时，周期性重建一次图层栅格，
        // 修复宿主丢弃合成图层后不再重绘导致的“横幅空白”。不依赖任何宿主事件，纯定时器驱动
        if (renderActive(now) && now - lastRepairAt >= LAYER_REPAIR_MS) {
          lastRepairAt = now;
          forceRepaint();
          forceReraster();
          if (tickCount % 5 === 0) {
            reportBannerDebug("repair:layer", video);
          }
        }
        // 源本身不可用（NETWORK_NO_SOURCE）时只尝试重建一次，之后保持封面兜底，避免无意义重试
        const sourceDead = video.networkState === 3;
        const sinceAttempt = now - budget.lastAttemptAt;
        // 仅在页面确实在屏幕上渲染时才升级重载/重建：隐藏标签页里浏览器会挂起媒体加载
        // （rAF 同时停摆），这不算故障，升级只会烧光恢复额度，让真正切回前台时反而没有额度可用；
        // 隐藏期间的恢复仍由 recover（交互/可见性/心跳信号）与保活分支负责
        const canEscalate = renderActive(now);
        if (
          canEscalate &&
          stallFor >= REMOUNT_AFTER_MS &&
          sinceAttempt >= RELOAD_AFTER_MS &&
          budget.remounts < (sourceDead ? 1 : 3)
        ) {
          budget.remounts += 1;
          budget.lastAttemptAt = now;
          reportBannerDebug("remount", video);
          setAttempt((value) => value + 1);
          return;
        }
        if (canEscalate && stallFor >= RELOAD_AFTER_MS && sinceAttempt >= RELOAD_AFTER_MS && budget.reloads < 3) {
          budget.reloads += 1;
          budget.lastAttemptAt = now;
          reportBannerDebug("reload", video);
          cover();
          video.load();
          ensurePlaying();
          return;
        }
        // 保活：重试额度耗尽后仍停滞时，低频再催一次加载/播放，保证切回前台后能自行恢复
        if (now - lastKeepaliveAt >= KEEPALIVE_MS) {
          lastKeepaliveAt = now;
          reportBannerDebug("keepalive", video);
          // 元数据始终没到位时，保活窗口重开一轮额度并重试加载：
          // load() 对 NETWORK_NO_SOURCE 同样有效，宿主不投递可见性/交互事件时，
          // 这是最后的自愈通道；真正隐藏的标签页里浏览器本就延迟媒体加载，重试代价极低
          if (video.readyState === 0) {
            budget.reloads = 0;
            budget.remounts = 0;
            budget.lastAttemptAt = 0;
            cover();
            video.load();
          } else if (!sourceDead) {
            nudgeFrame();
          }
          ensurePlaying();
        }
      }
      ensurePlaying();
      tickCount += 1;
      if (tickCount % 5 === 0) {
        reportBannerDebug("tick", video);
      }
    }, WATCH_INTERVAL_MS);

    // 渲染心跳：宿主用样式隐藏标签页时不触发可见性事件，rAF 出现长空档即视为“刚切回来”
    const heartbeat = (): void => {
      const now = Date.now();
      const suspended = now - lastRenderAt >= RENDER_GAP_MS;
      lastRenderAt = now;
      if (suspended) {
        suspendedFlag = true;
        recover("heartbeat");
      }
      rafId = window.requestAnimationFrame(heartbeat);
    };

    const fastEvents = ["loadedmetadata", "loadeddata", "canplay", "canplaythrough", "playing"];
    for (const name of fastEvents) {
      video.addEventListener(name, ensurePlaying);
    }
    // 被浏览器暂停：立即恢复播放，隐藏标签页也保持解码，切回时才有画面
    video.addEventListener("pause", ensurePlaying);
    video.addEventListener("error", onMediaError);
    // 明确的「回到前台」信号：清空恢复与播放节流后立即重试。
    // 后台标签页里浏览器会挂起媒体加载，切回后越早重试越早出画（从等待数秒压到一帧内）
    const revive = (reason: string): void => {
      if (stopped) {
        return;
      }
      lastRecoverAt = 0;
      lastPlayAttemptAt = 0;
      recover(reason);
    };
    // 宿主环境用样式隐藏标签页时不会触发 visibilitychange，用交叉观察兜底
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revive("intersect");
        }
      }
    });
    observer.observe(video);
    // 切到后台同时记为一次挂起：切回时 recover 据此重开一轮重试额度
    const onVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        suspendedFlag = true;
        return;
      }
      revive("visibility");
    };
    const onFocus = (): void => revive("focus");
    const onPageshow = (): void => revive("pageshow");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageshow);
    // 内置浏览器切标签页不投递可见性事件：用户回到页面后的任何交互都当作恢复信号
    const activityEvents = ["pointermove", "pointerdown", "wheel", "scroll", "keydown"];
    const onActivity = (): void => recover("activity");
    for (const name of activityEvents) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    // 导航栏「背景视频」开关：用户暂停优先于全部自愈逻辑；继续播放时清空节流立即恢复
    const onToggle = (): void => {
      if (stopped) {
        return;
      }
      userPaused = !userPaused;
      if (userPaused) {
        video.pause();
      } else {
        lastPlayAttemptAt = 0;
        lastRecoverAt = 0;
        recover("user");
      }
      publishBannerVideoState(!userPaused);
    };
    window.addEventListener(BANNER_VIDEO_TOGGLE_EVENT, onToggle);
    if (supportsFrameCallback) {
      video.requestVideoFrameCallback(onFrame);
    }
    rafId = window.requestAnimationFrame(heartbeat);

    // 先藏视频（封面已在容器背景上），确认出帧后再淡入
    video.style.opacity = "0";
    ensurePlaying();
    // 播报初始状态：导航栏按钮据此同步图标（新页面自动播放）
    publishBannerVideoState(true);
    reportBannerDebug(poster ? "mount:poster" : "mount:no-poster", video);

    return () => {
      stopped = true;
      window.clearInterval(watchdog);
      window.cancelAnimationFrame(rafId);
      if (kickTimer !== 0) {
        window.clearTimeout(kickTimer);
      }
      observer.disconnect();
      for (const name of fastEvents) {
        video.removeEventListener(name, ensurePlaying);
      }
      video.removeEventListener("pause", ensurePlaying);
      video.removeEventListener("error", onMediaError);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageshow);
      for (const name of activityEvents) {
        window.removeEventListener(name, onActivity);
      }
      window.removeEventListener(BANNER_VIDEO_TOGGLE_EVENT, onToggle);
    };
  }, [src, poster, attempt]);

  return (
    <div
      ref={frameRef}
      className={`${FRAME_CLASS} ${className}`}
      style={poster ? { ...FRAME_STYLE, backgroundImage: `url("${poster}")` } : FRAME_STYLE}
    >
      {/* 封面双保险：容器背景之外再放一层独立图片，宿主回收合成图层时至少有一层仍在绘制；
          视频长时间出不了帧时该图层会带上慢速推移动效（见 globals.css 的 [data-stuck] 规则） */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- 壁纸封面允许后台配置任意地址
        <img
          src={poster}
          alt=""
          aria-hidden
          draggable={false}
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: "0% 20%" }}
        />
      ) : null}
      {/* 封面兜底画在容器背景上：宿主回收视频图层时，横幅显示封面而不是空白 */}
      <video
        key={attempt}
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 size-full object-cover transition-opacity duration-300"
        style={{ objectPosition: "0% 20%" }}
      />
    </div>
  );
}