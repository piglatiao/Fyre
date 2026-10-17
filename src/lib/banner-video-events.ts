// 横幅背景视频的用户控制事件契约：导航栏按钮与视频组件之间解耦通信

// 请求切换播放状态（导航栏按钮派发，视频组件监听）
export const BANNER_VIDEO_TOGGLE_EVENT = "firefly:banner-video-toggle";

// 播放状态变化广播（视频组件派发，导航栏按钮监听）
export const BANNER_VIDEO_STATE_EVENT = "firefly:banner-video-state";

// 状态事件载荷：playing 为 false 表示已被用户手动暂停
export interface BannerVideoStateDetail {
  playing: boolean;
}

// 请求切换横幅视频播放状态
export function requestBannerVideoToggle(): void {
  window.dispatchEvent(new Event(BANNER_VIDEO_TOGGLE_EVENT));
}

// 广播横幅视频当前播放状态，供导航栏按钮同步图标
export function publishBannerVideoState(playing: boolean): void {
  window.dispatchEvent(
    new CustomEvent<BannerVideoStateDetail>(BANNER_VIDEO_STATE_EVENT, { detail: { playing } }),
  );
}