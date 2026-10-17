import { Globe, Mail, Rss } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/types/site-settings";
import WidgetCard from "./widget-card";

// 资料卡：头像、站名、简介与社交入口
export default function ProfileCard({ settings }: { settings: SiteSettings }) {
  const avatar = settings.authorAvatar || settings.siteLogo;
  const authorName = settings.authorName || settings.siteName;
  const bio = settings.authorBio || settings.siteDescription;

  return (
    <section className="card-base onload-animation rounded-(--radius-large) p-3">
      <div className="group relative mx-auto mt-1 mb-3 max-w-48 overflow-hidden rounded-xl lg:mx-0 lg:mt-0 lg:max-w-none">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- 头像由后台配置任意地址
          <img src={avatar} alt={`${authorName} 的头像`} className="h-full w-full object-cover" />
        ) : (
          <div
            aria-hidden
            className="flex aspect-square w-full items-center justify-center text-4xl font-bold text-white"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--primary) 45%, #fff), var(--primary) 75%)",
            }}
          >
            {authorName.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="px-2">
        <div className="mb-1 text-center text-xl font-bold">{authorName}</div>
        <div className="mx-auto mb-2 h-1 w-5 rounded-full bg-(--primary)" />
        {bio ? <div className="mb-2.5 text-center text-neutral-400">{bio}</div> : null}
        <div className="mb-1 flex flex-wrap justify-center gap-2">
          {settings.socialLinks.map((link) => (
            <a
              key={`${link.label}-${link.url}`}
              href={link.url}
              aria-label={link.label}
              title={link.label}
              target="_blank"
              rel="noreferrer"
              className="btn-regular h-10 w-10 rounded-lg active:scale-90"
            >
              {link.label.toLowerCase().includes("mail") || link.label.includes("邮箱") ? (
                <Mail aria-hidden className="size-5" />
              ) : (
                <Globe aria-hidden className="size-5" />
              )}
            </a>
          ))}
          <Link href="/rss.xml" aria-label="RSS 订阅" title="RSS 订阅" className="btn-regular h-10 w-10 rounded-lg active:scale-90">
            <Rss aria-hidden className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}