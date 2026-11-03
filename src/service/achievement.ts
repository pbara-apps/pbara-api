import AchievementDao from "@/dao/achievement";
import { logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import ChapterService from "@/service/chapter";

/**
 * Chapter achievements. Chapter officers add, edit and remove their own
 * chapter's achievements; they appear immediately (no approval step).
 * The association can view every chapter's achievements.
 */

export type AchievementInput = {
  chapterId: string;
  name: string;
  proofUrl: string;
  month: number;
  year: number;
  description?: string | null;
};

const actorOf = (user: PortalAuthUser) => ({ id: user.id, name: `${user.name} (${user.role})` });

/** An achievement can't be dated in the future. */
function assertNotFuture(month: number, year: number) {
  const now = new Date();
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) {
    throw httpError(400, "The month and year can't be in the future");
  }
}

async function getInScope(user: PortalAuthUser, id: string) {
  const achievement = await AchievementDao.findById(id);
  if (!achievement) throw httpError(404, "Achievement not found");
  const scope = await ChapterService.getScopeChapterIds(user);
  if (!scope.includes(String(achievement.chapter))) throw httpError(404, "Achievement not found");
  return achievement;
}

const AchievementService = {
  async list(user: PortalAuthUser, chapterId?: string) {
    const chapterIds = await ChapterService.resolveChapterIds(user, chapterId);
    return await AchievementDao.list({ chapterIds });
  },

  async create(user: PortalAuthUser, input: AchievementInput) {
    const chapter = await ChapterService.getAccessibleChapter(user, input.chapterId);
    assertNotFuture(input.month, input.year);
    const created = await AchievementDao.create({
      chapter: chapter._id,
      church: chapter.church,
      name: input.name,
      proofUrl: input.proofUrl,
      month: input.month,
      year: input.year,
      description: input.description?.trim() || null,
      createdBy: user.id,
    });
    await logAudit({
      action: "created",
      entityType: "achievement",
      entityId: String(created._id),
      entityTitle: input.name,
      actor: actorOf(user),
      detail: chapter.name,
    });
    return created;
  },

  async update(user: PortalAuthUser, id: string, input: Partial<Omit<AchievementInput, "chapterId">>) {
    const existing = await getInScope(user, id);
    assertNotFuture(input.month ?? existing.month, input.year ?? existing.year);
    const changes: Record<string, unknown> = { ...input };
    if (input.description !== undefined) changes.description = input.description?.trim() || null;
    const updated = await AchievementDao.update(id, changes);
    await logAudit({
      action: "updated",
      entityType: "achievement",
      entityId: id,
      entityTitle: updated?.name ?? existing.name,
      actor: actorOf(user),
    });
    return updated;
  },

  async remove(user: PortalAuthUser, id: string) {
    const existing = await getInScope(user, id);
    await AchievementDao.deleteById(id);
    await logAudit({
      action: "deleted",
      entityType: "achievement",
      entityId: id,
      entityTitle: existing.name,
      actor: actorOf(user),
    });
  },

  /** Association view: all achievements, optionally for one church or year. */
  async listAll(filter: { churchId?: string; year?: number }) {
    return await AchievementDao.list(filter);
  },
};

export default AchievementService;
