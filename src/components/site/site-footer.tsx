import type { SiteSettings } from "@/types/site-settings";

// 前台页脚：站点版权、订阅入口与备案号
export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer pb-4 md:pb-6">
      <div className="transition mx-32 mt-10 mb-5 border-t border-dashed border-black/10 dark:border-white/15" />
      <div className="flex flex-col items-center justify-center px-6">
        <div className="text-50 text-center text-sm">
          <div className="mx-0.5 my-2.5 flex flex-wrap justify-center gap-x-2 gap-y-2.5">
            <span>
              © {year} {settings.siteName}. All Rights Reserved.
            </span>
            <span aria-hidden>/</span>
            <a className="font-medium text-(--primary) transition hover:opacity-80" href="/rss.xml">
              RSS
            </a>
            <span aria-hidden>/</span>
            <a className="font-medium text-(--primary) transition hover:opacity-80" href="/atom.xml">
              Atom
            </a>
            <span aria-hidden>/</span>
            <a className="font-medium text-(--primary) transition hover:opacity-80" href="/sitemap-index.xml">
              Sitemap
            </a>
          </div>
          {settings.footerText ? (
            <div className="mx-0.5 my-2.5 flex flex-wrap justify-center gap-x-2 gap-y-2.5">
              <span>{settings.footerText}</span>
            </div>
          ) : null}
          {settings.icpNumber ? (
            <div className="mx-0.5 my-2.5 flex flex-wrap justify-center gap-x-2 gap-y-2.5">
              <a
                className="transition hover:text-(--primary)"
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noreferrer"
              >
                {settings.icpNumber}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
