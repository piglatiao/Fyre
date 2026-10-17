import { Quote } from "lucide-react";

// 文章页横幅标题浮层：与官网一致，仅在 lg 以上显示标题与摘要
export default function PostBannerOverlay({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="banner-post-meta-overlay pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex">
      <div className="mb-0 w-4/5 text-center lg:w-3/4">
        <div className="flex flex-col items-center gap-3">
          <div className="banner-post-title text-white">{title}</div>
          {description ? (
            <div className="flex flex-col items-center gap-3">
              <div className="banner-post-description-divider h-px w-12 bg-white/60" />
              <div className="banner-post-description text-white/85">
                <Quote aria-hidden className="banner-post-description-quote banner-post-description-quote-start" />
                <span className="banner-post-description-text">{description}</span>
                <Quote aria-hidden className="banner-post-description-quote banner-post-description-quote-end" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}