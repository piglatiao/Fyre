import { renderMarkdown } from "@/lib/markdown";
import type { PageRepository } from "@/server/repositories/page.repository.interface";
import type { CustomPageView } from "@/types/custom-page-view";
import type { PageService } from "./page.service.interface";

// 自定义页面服务默认实现：负责把 Markdown 正文渲染为安全 HTML
export class DefaultPageService implements PageService {
  constructor(private readonly pages: PageRepository) {}

  async getPublishedBySlug(slug: string): Promise<CustomPageView | null> {
    const page = await this.pages.findPublishedBySlug(slug);
    if (!page) {
      return null;
    }
    const rendered = await renderMarkdown(page.content);
    return { page, html: rendered.html, toc: rendered.toc };
  }

  async listPublishedEntries(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.pages.listPublished();
  }
}
