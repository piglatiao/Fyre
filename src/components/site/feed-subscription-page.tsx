import { ArrowRight, Atom, BookOpen, Rss } from "lucide-react";
import Link from "next/link";
import BannerPortal from "@/components/site/banner-portal";
import CopyButton from "@/components/site/copy-button";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { formatDate } from "@/lib/format-date";
import { toPlainText } from "@/lib/plain-text";
import { getSiteUrl } from "@/lib/site-url";
import { createSiteServices } from "@/server/services/service-container";
import type { FeedSubscriptionKind } from "@/types/feed-subscription-kind";

// 订阅页展示的最新文章数量
const FEED_PREVIEW_LIMIT = 6;

const feedPageConfig: Record<
  FeedSubscriptionKind,
  { title: string; description: string; path: string; icon: typeof Rss; reader: string }
> = {
  rss: {
    title: "RSS 订阅",
    description: "通过 RSS 订阅，第一时间获取最新文章和动态",
    path: "/rss.xml",
    icon: Rss,
    reader: "RSS",
  },
  atom: {
    title: "Atom 订阅",
    description: "通过 Atom 订阅，第一时间获取最新文章和动态",
    path: "/atom.xml",
    icon: Atom,
    reader: "Atom",
  },
};

// 订阅说明页：订阅地址、最新文章与阅读器使用提示
export default async function FeedSubscriptionPage({ kind }: { kind: FeedSubscriptionKind }) {
  const config = feedPageConfig[kind];
  const Icon = config.icon;
  const baseUrl = getSiteUrl();
  const feedUrl = `${baseUrl}${config.path}`;
  const { postService } = createSiteServices();
  const posts = (await postService.listFeedItems(FEED_PREVIEW_LIMIT)).filter((post) => !post.encrypted);

  return (
    <div className="onload-animation flex flex-col gap-4">
      <SiteCategoryBar />
      <section className="card-base overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-5">
          <div className="page-icon" aria-hidden>
            <Icon className="size-8" />
          </div>
          <div>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-(--line-color) bg-(--btn-regular-bg)/45 p-4 md:p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Icon aria-hidden className="size-4 text-(--primary)" />
            {config.reader} 链接
          </div>
          <p className="mb-3 text-xs text-(--content-meta)">复制链接到你的 {config.reader} 阅读器</p>
          <div className="flex min-w-0 items-center gap-3 rounded-xl bg-(--card-bg) px-3 py-2.5 shadow-sm">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-(--btn-content)">{feedUrl}</code>
            <CopyButton value={feedUrl} label={`复制 ${config.reader} 链接`} />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="card-base overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-7">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen aria-hidden className="size-4 text-(--primary)" />
            <h2 className="text-base font-bold">最新文章</h2>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="group block rounded-xl border border-transparent px-3 py-3 transition hover:border-(--line-color) hover:bg-(--btn-regular-bg)/35"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="min-w-0 font-semibold text-(--btn-content) transition group-hover:text-(--primary)">
                      {post.title}
                    </span>
                    <time className="shrink-0 text-xs text-(--content-meta)" dateTime={post.publishedAt.toISOString()}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-(--content-meta)">
                    {post.seoDescription ?? toPlainText(post.content, 120)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-(--content-meta)">还没有可订阅的文章。</p>
          )}
          <Link
            href="/archive"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--primary) transition hover:opacity-80"
          >
            查看全部文章
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </section>

        <section className="card-base overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-7">
          <h2 className="mb-3 text-base font-bold">什么是 {config.reader}？</h2>
          <p className="text-sm leading-relaxed text-(--content-meta)">
            {config.reader} 是一种用于发布经常更新内容的标准格式。通过 {config.reader}，你可以：
          </p>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-(--content-meta)">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--primary)" aria-hidden />
              第一时间收到新文章，不需要反复访问站点；
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--primary)" aria-hidden />
              集中管理订阅内容，不受平台推荐算法影响；
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--primary)" aria-hidden />
              无需注册账号，尊重隐私且便于归档。
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-(--content-meta)">
            推荐使用 Feedly、Inoreader 或其他 {config.reader} 阅读器订阅本站。
          </p>
          <Link
            href="/about"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--primary) transition hover:opacity-80"
          >
            了解更多
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </section>
      </div>

      <BannerPortal>
        <PageBannerOverlay title={config.title} />
      </BannerPortal>
    </div>
  );
}
