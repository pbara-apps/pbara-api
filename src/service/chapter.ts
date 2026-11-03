import ChapterDao from "@/dao/chapter";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";

/**
 * Chapter service: default chapters and access scope.
 *
 * Access rule (used by every chapter portal feature):
 * - counsellor → every active chapter in their church
 * - president / secretary → only their own chapter
 */
const ChapterService = {
  /**
   * Makes sure a church has its default chapter, creating it if missing.
   * The default chapter takes the church's chapter name (e.g. "Antioch Chapter").
   */
  async ensureDefaultChapter(church: { _id: unknown; name: string; chapter?: string | null }) {
    const churchId = String(church._id);
    const existing = await ChapterDao.findDefaultForChurch(churchId);
    if (existing) return existing;
    return await ChapterDao.create({
      name: church.chapter?.trim() || church.name,
      church: churchId,
      isDefault: true,
      status: "active",
    });
  },

  /** Keeps the default chapter's name in step when the church's chapter name is edited. */
  async syncDefaultChapterName(churchId: string, chapterName: string) {
    const chapter = await ChapterDao.findDefaultForChurch(churchId);
    if (chapter && chapter.name !== chapterName) {
      await ChapterDao.updateName(String(chapter._id), chapterName);
    }
  },

  /** Ids of the chapters this portal user may see. */
  async getScopeChapterIds(user: PortalAuthUser): Promise<string[]> {
    if (user.role === "counsellor") {
      const chapters = await ChapterDao.findActiveByChurch(user.churchId);
      return chapters.map((c) => String(c._id));
    }
    return user.chapterId ? [user.chapterId] : [];
  },

  /**
   * Resolves which chapters a request should cover:
   * a specific chapter (checked against the user's scope) or all chapters in scope.
   */
  async resolveChapterIds(user: PortalAuthUser, chapterId?: string): Promise<string[]> {
    const scope = await ChapterService.getScopeChapterIds(user);
    if (!chapterId) return scope;
    if (!scope.includes(chapterId)) {
      throw httpError(403, "You don't have access to this chapter");
    }
    return [chapterId];
  },

  /** Loads a chapter after checking the user may act on it. */
  async getAccessibleChapter(user: PortalAuthUser, chapterId: string) {
    await ChapterService.resolveChapterIds(user, chapterId);
    const chapter = await ChapterDao.findById(chapterId);
    if (!chapter || chapter.status !== "active") {
      throw httpError(404, "Chapter not found");
    }
    return chapter;
  },

  /** Chapters the user can see, with their church name. */
  async listChaptersForUser(user: PortalAuthUser) {
    const ids = await ChapterService.getScopeChapterIds(user);
    return await ChapterDao.findByIds(ids);
  },
};

export default ChapterService;
