import type { PostStatus } from "@/generated/prisma/client";
import { parseFrontMatter, readListValue } from "@/lib/markdown-front-matter";
import { parseOptionalDate } from "@/lib/parse-date";
import type { MarkdownImportFile } from "@/types/markdown-import-file";
import type { MarkdownImportResult } from "@/types/markdown-import-result";
import type { PostUpsertInput } from "@/types/post-upsert-input";
import type { AdminCategoryService } from "./admin-category.service.interface";
import type { AdminPostService } from "./admin-post.service.interface";
import type { AdminTagService } from "./admin-tag.service.interface";
import type { MarkdownImportService } from "./markdown-import.service.interface";
import { ServiceError } from "./service-error";

// 自动摘要长度上限
const EXCERPT_LENGTH = 120;

// 标题兜底：取正文里第一个一级标题
function readFirstHeading(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

// 标题兜底：去掉文件扩展名
function stripExtension(fileName: string): string {
  return fileName.replace(/\.(md|markdown|txt)$/i, "").trim();
}

// 摘要兜底：取第一段正文并去掉常见 Markdown 标记
function deriveExcerpt(content: string): string | null {
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("```") ||
      line.startsWith(">") ||
      line.startsWith("---") ||
      line.startsWith("![")
    ) {
      continue;
    }
    const plain = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*`_~]/g, "")
      .trim();
    if (plain) {
      return plain.length > EXCERPT_LENGTH ? plain.slice(0, EXCERPT_LENGTH) + "…" : plain;
    }
  }
  return null;
}

// 头部 status 归一化：兼容 draft/published/scheduled/private 常见写法
function readStatus(value: string | undefined, fallback: PostStatus): PostStatus {
  switch ((value ?? "").trim().toLowerCase()) {
    case "draft":
      return "DRAFT";
    case "published":
    case "publish":
      return "PUBLISHED";
    case "scheduled":
    case "schedule":
      return "SCHEDULED";
    case "private":
      return "PRIVATE";
    default:
      return fallback;
  }
}

// 头部布尔值解析
function readBoolean(value: string | undefined): boolean {
  const text = (value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

// Markdown 导入服务实现：逐文件解析头部信息，复用后台文章/标签/分类服务写入
export class DefaultMarkdownImportService implements MarkdownImportService {
  constructor(
    private readonly posts: AdminPostService,
    private readonly tags: AdminTagService,
    private readonly categories: AdminCategoryService,
  ) {}

  async importDocuments(files: MarkdownImportFile[], defaultStatus: PostStatus): Promise<MarkdownImportResult> {
    const result: MarkdownImportResult = { created: [], failed: [] };
    const tagIdByName = new Map<string, number>();
    const categoryIdByName = new Map<string, number>();
    for (const tag of await this.tags.list()) {
      tagIdByName.set(tag.name.trim().toLowerCase(), tag.id);
    }
    for (const category of await this.categories.list()) {
      categoryIdByName.set(category.name.trim().toLowerCase(), category.id);
    }

    for (const file of files) {
      try {
        const document = parseFrontMatter(file.content);
        const header = document.data as Record<string, string | undefined>;
        const content = document.content.trim();
        const title = (header.title ?? "").trim() || readFirstHeading(content) || stripExtension(file.fileName);
        if (!title) {
          throw new ServiceError("import_title_missing", "无法确定标题，请在头部写 title 或在正文首行写 # 标题");
        }
        const status = readStatus(header.status, defaultStatus);
        const dateText = (header.date ?? header.publishedat ?? "").trim();
        const date = parseOptionalDate(dateText);
        const tagIds = await this.resolveTagIds(readListValue(header.tags), tagIdByName);
        const categoryId = await this.resolveCategoryId(header.category, categoryIdByName);
        const input: PostUpsertInput = {
          title,
          slug: (header.slug ?? "").trim(),
          content: content || title,
          excerpt: (header.excerpt ?? header.summary ?? "").trim() || deriveExcerpt(content),
          coverUrl: (header.cover ?? "").trim() || null,
          status,
          pinned: readBoolean(header.pinned),
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
          publishedAt: status === "SCHEDULED" ? null : date ?? (status === "PUBLISHED" ? new Date() : null),
          scheduledAt: status === "SCHEDULED" ? date : null,
          categoryId,
          tagIds,
          series: (header.series ?? "").trim() || null,
          encrypted: false,
          password: null,
        };
        const created = await this.posts.create(input);
        const detail = await this.posts.getById(created.id);
        result.created.push({ id: created.id, title, slug: detail?.slug ?? input.slug });
      } catch (error) {
        result.failed.push({
          fileName: file.fileName,
          reason: error instanceof ServiceError ? error.message : "导入失败，请检查文件内容",
        });
      }
    }
    return result;
  }

  // 标签按名称匹配，缺失时自动创建
  private async resolveTagIds(names: string[], cache: Map<string, number>): Promise<number[]> {
    const ids: number[] = [];
    for (const name of names) {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (!key) {
        continue;
      }
      let id = cache.get(key);
      if (id === undefined) {
        const created = await this.tags.create({ name: trimmed, slug: "" });
        id = created.id;
        cache.set(key, id);
      }
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
    return ids;
  }

  // 分类按名称匹配，缺失时自动创建
  private async resolveCategoryId(name: string | undefined, cache: Map<string, number>): Promise<number | null> {
    const trimmed = (name ?? "").trim();
    if (!trimmed) {
      return null;
    }
    const key = trimmed.toLowerCase();
    let id = cache.get(key);
    if (id === undefined) {
      const created = await this.categories.create({ name: trimmed, slug: "", description: null, sort: 0 });
      id = created.id;
      cache.set(key, id);
    }
    return id;
  }
}
