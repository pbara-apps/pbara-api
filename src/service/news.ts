import NewsDao from "@/dao/news";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { sanitizePlainText, sanitizeRichText } from "@/helpers/content-sanitizer";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(title: string, excludeId?: string) {
  let base = slugify(title) || "news-item";
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await NewsDao.findBySlug(slug);
    if (!existing || String(existing._id) === excludeId) break;
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
}

type NewsInput = {
  title: string;
  slug?: string;
  category: string;
  excerpt: string;
  content?: string;
  image?: string | null;
  author?: string | null;
  read_time?: number;
  status?: "draft" | "published";
};

const NewsService = {
  async create(data: NewsInput, actor?: AuditActor) {
    const payload: NewsInput = {
      ...data,
      title: sanitizePlainText(data.title),
      category: sanitizePlainText(data.category),
      excerpt: sanitizePlainText(data.excerpt),
      content: sanitizeRichText(data.content),
      author: sanitizePlainText(data.author ?? ""),
    };
    const slug = payload.slug?.trim() || (await uniqueSlug(payload.title));
    const news = await NewsDao.create({ ...payload, slug });
    await logAudit({
      action: "created",
      entityType: "news",
      entityId: String(news._id),
      entityTitle: news.title,
      actor,
      detail: news.status,
    });
    return news;
  },
  async getAll() {
    return await NewsDao.findAll();
  },
  async getPublic() {
    return await NewsDao.findPublic();
  },
  async getPublicByIdOrSlug(idOrSlug: string) {
    const article = await NewsDao.findPublicByIdOrSlug(idOrSlug);
    if (!article) {
      const err = new Error("News article not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const related = await NewsDao.findRelated(
      article.category,
      String(article._id),
      4,
    );
    return { article, related };
  },
  async getById(id: string) {
    const item = await NewsDao.findById(id);
    if (!item) {
      const err = new Error("News article not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return item;
  },
  async update(id: string, data: Partial<NewsInput>, actor?: AuditActor) {
    const existing = await NewsDao.findById(id);
    if (!existing) {
      const err = new Error("News article not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const payload = { ...data } as Partial<NewsInput>;
    if (payload.title != null) payload.title = sanitizePlainText(payload.title);
    if (payload.category != null) payload.category = sanitizePlainText(payload.category);
    if (payload.excerpt != null) payload.excerpt = sanitizePlainText(payload.excerpt);
    if (payload.content != null) payload.content = sanitizeRichText(payload.content);
    if (payload.author != null) payload.author = sanitizePlainText(payload.author);
    if (payload.title && !payload.slug) {
      payload.slug = await uniqueSlug(payload.title, id);
    }
    const updated = await NewsDao.update(id, payload);
    await logAudit({
      action: "updated",
      entityType: "news",
      entityId: id,
      entityTitle: updated?.title ?? existing.title,
      actor,
    });
    return updated;
  },
  async delete(id: string, actor?: AuditActor) {
    const existing = await NewsDao.findById(id);
    if (!existing) {
      const err = new Error("News article not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    await NewsDao.delete(id);
    await logAudit({
      action: "deleted",
      entityType: "news",
      entityId: id,
      entityTitle: existing.title,
      actor,
    });
  },
  async deleteMany(ids: string[], actor?: AuditActor) {
    for (const id of ids) {
      const existing = await NewsDao.findById(id);
      if (existing) {
        await logAudit({
          action: "deleted",
          entityType: "news",
          entityId: id,
          entityTitle: existing.title,
          actor,
        });
      }
    }
    return await NewsDao.deleteMany(ids);
  },
  async countAll() {
    return await NewsDao.countAll();
  },
  async countPublished() {
    return await NewsDao.countPublished();
  },
};

export default NewsService;
