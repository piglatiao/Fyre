"use client";

import { useEffect, useState } from "react";

// 首页/页面横幅壁纸轮播：只渲染当前、上一张与下一张，避免一次性加载全部大图
export default function BannerCarousel({
  desktopImages,
  mobileImages,
  intervalSeconds,
  fade,
}: {
  /** 桌面端图片地址列表 */
  desktopImages: string[];
  /** 移动端图片地址列表；为空时复用桌面端 */
  mobileImages: string[];
  /** 自动切换间隔（秒） */
  intervalSeconds: number;
  /** 是否使用渐变过渡 */
  fade: boolean;
}) {
  const count = Math.max(desktopImages.length, mobileImages.length);
  const [slide, setSlide] = useState({ current: 0, previous: -1 });
  const { current, previous } = slide;

  // 自动轮播：只有多张图片、未开启减少动态效果且页面可见时推进
  useEffect(() => {
    if (count < 2) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      setSlide((value) => ({ previous: value.current, current: (value.current + 1) % count }));
    }, Math.max(3, intervalSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [count, intervalSeconds]);

  if (count === 0) {
    return null;
  }

  const next = count > 1 ? (current + 1) % count : -1;
  const visibleIndexes: number[] = [];
  if (previous >= 0 && previous < count && previous !== current) {
    visibleIndexes.push(previous);
  }
  visibleIndexes.push(current);
  if (next >= 0 && !visibleIndexes.includes(next)) {
    visibleIndexes.push(next);
  }

  // 按索引取图：桌面/移动列表长度不一致时循环复用，移动端优先使用专属图片
  function resolveSources(index: number): { desktop: string; mobile: string } | null {
    const desktop = desktopImages.length
      ? desktopImages[index % desktopImages.length]
      : mobileImages[index % mobileImages.length];
    if (!desktop) {
      return null;
    }
    const mobile = mobileImages.length ? mobileImages[index % mobileImages.length] : desktop;
    return { desktop, mobile };
  }

  return (
    <div
      className={`banner-carousel absolute inset-0${fade ? " banner-carousel--fade" : ""}`}
      aria-hidden
      data-carousel-index={current}
    >
      {visibleIndexes.map((index) => {
        const sources = resolveSources(index);
        if (!sources) {
          return null;
        }
        const active = index === current;
        return (
          <div
            key={`${index}-${sources.desktop}`}
            className={`banner-carousel-slide${active ? " is-active" : ""}`}
            data-index={index}
            data-active={active ? "true" : "false"}
          >
            <picture>
              {sources.mobile !== sources.desktop ? (
                <source media="(max-width: 1023px)" srcSet={sources.mobile} />
              ) : null}
              <img
                src={sources.desktop}
                alt=""
                loading={active || index === next ? "eager" : "lazy"}
                fetchPriority={active ? "high" : "auto"}
                decoding="async"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: "0% 20%" }}
              />
            </picture>
          </div>
        );
      })}
    </div>
  );
}
