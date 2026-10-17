import type { Metadata } from "next";
import { Heart, Info, UsersRound } from "lucide-react";
import BannerPortal from "@/components/site/banner-portal";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteComments from "@/components/site/site-comments";
import SiteCategoryBar from "@/components/site/site-category-bar";
import SponsorMethodCard from "@/components/site/sponsor-method-card";
import SponsorRecordAvatar from "@/components/site/sponsor-record-avatar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "打赏",
  description: "如果流萤的内容对你有帮助，欢迎请我喝杯咖啡",
};

// 打赏页：用途说明、打赏方式、打赏者名单与评论区挂载位
export default async function SponsorPage() {
  const { sponsorService, settingService } = createSiteServices();
  const [methods, records, settings] = await Promise.all([
    sponsorService.listMethods(),
    sponsorService.listRecords(),
    settingService.getSiteSettings(),
  ]);

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      <div className="card-base mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-8">
          <div className="page-icon" aria-hidden>
            <Heart className="size-8" />
          </div>
          <div>
            <h1>打赏</h1>
            <p>如果流萤的内容对你有帮助，欢迎请我喝杯咖啡 · {methods.length} 种方式</p>
          </div>
        </div>

        {settings.sponsorUsage ? (
          <div className="mt-4 mb-8 rounded-lg border border-(--primary)/30 bg-(--primary)/8 p-4 backdrop-blur-xs dark:border-none dark:bg-(--btn-regular-bg)">
            <div className="flex items-start gap-2">
              <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-(--primary)" />
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                <span className="font-semibold text-(--primary)">打赏用途：</span>
                {settings.sponsorUsage}
              </p>
            </div>
          </div>
        ) : null}

        <section aria-labelledby="sponsor-methods-title">
          <h2 id="sponsor-methods-title" className="mb-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">
            支持方式
          </h2>
          {methods.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {methods.map((method) => (
                <SponsorMethodCard key={method.id} method={method} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-(--line-divider) px-4 py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
              暂未配置打赏方式，可稍后再来看看。
            </p>
          )}
        </section>
      </div>

      {settings.sponsorShowList ? (
        <section className="card-base mb-4 rounded-(--radius-large) px-5 py-6 md:px-9">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary)">
                <UsersRound aria-hidden className="size-5" />
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">打赏者名单</h2>
            </div>
            {records.length > 0 ? (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">{records.length}</span>
            ) : null}
          </div>

          {records.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="group flex items-start gap-3 rounded-xl border border-(--line-divider) p-3 transition-all duration-200 hover:border-(--primary)"
                >
                  <SponsorRecordAvatar avatarUrl={record.avatarUrl} name={record.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {record.name}
                      </span>
                      {record.amount ? (
                        <span className="shrink-0 text-xs font-bold text-(--primary)">{record.amount}</span>
                      ) : null}
                    </div>
                    {record.sponsoredAt ? (
                      <span className="mt-0.5 block text-[0.65rem] text-neutral-400 dark:text-neutral-500">
                        {record.sponsoredAt}
                      </span>
                    ) : null}
                    {record.message ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {record.message}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-500">
              还没有打赏记录，期待成为第一位支持者。
            </p>
          )}
        </section>
      ) : null}

      <SiteComments
        provider={settings.commentProvider}
        config={settings.commentConfig}
        path="/sponsor"
        title="打赏"
      />

      <BannerPortal>
        <PageBannerOverlay title="打赏" />
      </BannerPortal>
    </div>
  );
}
