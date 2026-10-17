import type { ThemeMode } from "@/types/theme-mode";
import type { WallpaperMode } from "@/types/wallpaper-mode";

// 主题默认值与归一化工具：全站配色由色相（--hue）驱动，与官网 oklch 体系一致

// 默认色相：与官网默认值保持一致
export const DEFAULT_THEME_HUE = 165;

// 默认卡片透明度（0-1）
export const DEFAULT_CARD_OPACITY = 0.6;

// 默认主题模式
export const DEFAULT_THEME_MODE: ThemeMode = "system";

// 归一化色相到 0-360 整数，非法值回退默认色相
export function normalizeHue(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_THEME_HUE;
  }
  const rounded = Math.round(value);
  return ((rounded % 360) + 360) % 360;
}

// 归一化卡片透明度到 0-1，非法值回退默认透明度
export function normalizeCardOpacity(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CARD_OPACITY;
  }
  return Math.min(1, Math.max(0, value));
}

// 默认壁纸轮播间隔（秒）
export const DEFAULT_WALLPAPER_CAROUSEL_INTERVAL = 5;

// 归一化壁纸轮播间隔到 3-60 秒，非法值回退默认值
export function normalizeWallpaperCarouselInterval(
  value: number | null | undefined,
  fallback: number = DEFAULT_WALLPAPER_CAROUSEL_INTERVAL,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(60, Math.max(3, Math.round(value)));
}

// 默认壁纸模式：banner=有顶部横幅
export const DEFAULT_WALLPAPER_MODE: WallpaperMode = "banner";

// 默认横幅高度（vh）：首页 65，其余页面 45
export const DEFAULT_BANNER_HEIGHT_HOME = 65;
export const DEFAULT_BANNER_HEIGHT_NON_HOME = 45;

// 归一化横幅高度（vh）到 20-100，非法值回退默认高度
export function normalizeBannerHeight(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(20, Math.round(value)));
}

// 默认壁纸模糊（px）：overlay / fullscreen 模式下壁纸的背景模糊
export const DEFAULT_OVERLAY_BLUR = 0;
export const DEFAULT_FULLSCREEN_BLUR = 0;

// 归一化壁纸模糊（px）到 0-40 整数，非法值回退默认值
export function normalizeWallpaperBlur(value: number | null | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(40, Math.max(0, Math.round(value)));
}
