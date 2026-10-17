// 横幅诊断上报（仅开发期）：把视频壁纸在真实浏览器里的状态回传到本地调试接口，
// 用于排查“切换标签页后横幅空白”这类只在内嵌浏览器复现的问题；生产构建下为空实现。

const ENABLED = process.env.NODE_ENV !== "production";
// 单次页面会话最多上报条数，避免刷屏
const MAX_REPORTS = 400;
let sentCount = 0;
// 页面会话标识：用于区分同一台机器上的多个浏览器实例
const SESSION_ID = Math.random().toString(36).slice(2, 8);

// 采集当前横幅视频的关键状态
function collectBannerState(video: HTMLVideoElement | null): Record<string, unknown> {
  const quality =
    video && typeof video.getVideoPlaybackQuality === "function" ? video.getVideoPlaybackQuality() : null;
  // 横幅容器与封面图层的状态：用于定位“横幅空白”“封面未绘制”这类只在特定宿主里出现的问题
  const frame = document.querySelector<HTMLElement>(".banner-media-frame");
  const posterImg = frame ? frame.querySelector("img") : null;
  const wrapper = document.getElementById("wallpaper-wrapper");
  const rafAt = video && video.dataset.rafAt ? Number(video.dataset.rafAt) : 0;
  return {
    mode: document.querySelector(".site-wrapper")?.getAttribute("data-wallpaper") ?? null,
    wrapH: wrapper ? Math.round(wrapper.getBoundingClientRect().height) : null,
    stuck: frame ? frame.dataset.stuck === "true" : null,
    posterOk: posterImg ? posterImg.naturalWidth > 0 : null,
    rafAge: rafAt > 0 ? Date.now() - rafAt : null,
    sid: SESSION_ID,
    ua: navigator.userAgent.slice(0, 120),
    view: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
    vis: document.visibilityState,
    focus: document.hasFocus(),
    rects: video ? video.getClientRects().length : -1,
    paused: video ? video.paused : null,
    rs: video ? video.readyState : null,
    net: video ? video.networkState : null,
    t: video ? Number(video.currentTime.toFixed(2)) : null,
    op: video ? video.style.opacity : null,
    err: video && video.error ? video.error.code : null,
    frames: quality ? quality.totalVideoFrames : null,
    dropped: quality ? quality.droppedVideoFrames : null,
  };
}

// 上报一条横幅事件；任何失败都静默忽略，绝不影响页面本身
export function reportBannerDebug(event: string, video: HTMLVideoElement | null): void {
  if (!ENABLED || sentCount >= MAX_REPORTS || typeof window === "undefined") {
    return;
  }
  sentCount += 1;
  try {
    const payload = JSON.stringify({ event, at: Date.now(), ...collectBannerState(video) });
    void fetch("/api/debug/banner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
      cache: "no-store",
    }).catch(() => undefined);
  } catch {
    // 诊断本身不能影响页面
  }
}