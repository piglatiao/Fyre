import type { CSSProperties } from "react";
import { isVideoUrl } from "@/lib/media-url";
import BannerVideo from "./banner-video";

// 图片层样式：填满壁纸容器并沿用官网的垂直裁切位置
const MEDIA_CLASS = "absolute inset-0 size-full object-cover";
const MEDIA_STYLE: CSSProperties = { objectPosition: "0% 20%" };

// 横幅媒体：按后台配置渲染图片（含 GIF）或视频（MP4/WebM 等），支持桌面与移动分别配置
// videoPoster 作为视频封面兜底，视频加载或重载期间横幅不会空白
export default function BannerMedia({
  desktopUrl,
  mobileUrl,
  videoPoster,
}: {
  desktopUrl: string;
  mobileUrl: string;
  videoPoster?: string;
}) {
  const desktop = desktopUrl || mobileUrl;
  if (!desktop) {
    return null;
  }
  const desktopIsVideo = isVideoUrl(desktop);
  const mobileIsVideo = isVideoUrl(mobileUrl);
  const mobileDiffers = mobileUrl.length > 0 && mobileUrl !== desktop;
  const poster = videoPoster?.trim() ? videoPoster : undefined;

  // 桌面视频 + 移动视频：两个断点各渲染一个 video（video 内的 source media 在 Chrome 中不生效）
  if (desktopIsVideo && mobileDiffers && mobileIsVideo) {
    return (
      <>
        <BannerVideo src={desktop} poster={poster} className="max-lg:hidden" />
        <BannerVideo src={mobileUrl} className="lg:hidden" />
      </>
    );
  }

  // 桌面视频 + 移动图片：桌面放视频，移动端放静态图
  if (desktopIsVideo && mobileDiffers) {
    return (
      <>
        <BannerVideo src={desktop} poster={poster ?? mobileUrl} className="max-lg:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- 壁纸支持后台配置任意地址 */}
        <img
          key="banner-img"
          src={mobileUrl}
          alt=""
          loading="eager"
          decoding="async"
          className={`${MEDIA_CLASS} lg:hidden`}
          style={MEDIA_STYLE}
        />
      </>
    );
  }

  // 桌面图片 + 移动视频：桌面放图片，移动端放视频
  if (!desktopIsVideo && mobileDiffers && mobileIsVideo) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- 壁纸支持后台配置任意地址 */}
        <img
          key="banner-img"
          src={desktop}
          alt=""
          loading="eager"
          decoding="async"
          className={`${MEDIA_CLASS} max-lg:hidden`}
          style={MEDIA_STYLE}
        />
        <BannerVideo src={mobileUrl} poster={poster ?? desktop} className="lg:hidden" />
      </>
    );
  }

  // 纯视频（含仅配置桌面视频、未单独配置移动端）
  if (desktopIsVideo) {
    return <BannerVideo src={desktop} poster={poster} className="" />;
  }

  // 图片（含 GIF 动图）：移动端单独配置时按媒体查询切换
  return (
    <picture>
      {mobileDiffers ? <source media="(max-width: 1023px)" srcSet={mobileUrl} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- 壁纸支持后台配置任意地址 */}
      <img
        src={desktop}
        alt=""
        loading="eager"
        decoding="async"
        className={MEDIA_CLASS}
        style={MEDIA_STYLE}
      />
    </picture>
  );
}