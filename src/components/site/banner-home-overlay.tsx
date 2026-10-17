import { Globe, Heart, Mail, Rss } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { SiteSettings } from "@/types/site-settings";
import BannerTypewriter from "./banner-typewriter";
import ProjectLinkIcon from "./project-link-icon";

// 按社交链接名称匹配图标，未知类型使用通用地球图标
function resolveIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("mail") || normalized.includes("邮箱")) {
    return Mail;
  }
  if (normalized.includes("rss")) {
    return Rss;
  }
  return Globe;
}

// 首页横幅文字浮层：站点标题 + 打字机副标题 + 社交入口
// （向下滚动指示器改由 site-shell 在壁纸容器外渲染，与官网一致：仅全屏壁纸 + 首页显示）
export default function BannerHomeOverlay({ settings }: { settings: SiteSettings }) {
  const title = settings.bannerTitle || settings.siteName;
  const subtitles =
    settings.bannerSubtitles.length > 0
      ? settings.bannerSubtitles
      : settings.bannerSubtitle
        ? [settings.bannerSubtitle]
        : [];

  return (
    <>
      <div className="banner-home-text-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4 lg:p-8">
        <div className="w-[95%] text-center lg:w-3/4">
          <div
            className="banner-title mb-2 lg:mb-4"
            style={{ "--banner-title-size": "4.5rem" } as CSSProperties}
          >
            {title}
          </div>
          {subtitles.length > 0 ? (
            <div className="banner-subtitle text-base leading-[1.3] lg:text-2xl lg:leading-snug">
              <BannerTypewriter texts={subtitles} enabled={settings.typewriterEnabled} />
            </div>
          ) : null}
          <div className="banner-links pointer-events-auto mt-5 flex items-center justify-center gap-3">
            {settings.socialLinks
              .filter((link) => !/rss|订阅/i.test(link.label))
              .map((link) => {
                const Icon = resolveIcon(link.label);
                const showText = link.label.toLowerCase().includes("github");
                return (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    aria-label={link.label}
                    title={link.label}
                    target="_blank"
                    rel="noreferrer"
                    className={`banner-link ${showText ? "banner-link-text" : ""}`}
                  >
                    {showText ? (
                      <ProjectLinkIcon icon="github" label={link.label} className="size-5" />
                    ) : (
                      <Icon aria-hidden className="size-5" />
                    )}
                    {showText ? <span>{link.label}</span> : null}
                  </a>
                );
              })}
            <Link href="/sponsor" aria-label="打赏" title="打赏" className="banner-link">
              <Heart aria-hidden className="size-5" />
            </Link>
            <Link href="/rss" aria-label="RSS 订阅" title="RSS 订阅" className="banner-link">
              <Rss aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
