import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import { logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import AmbassadorModel from "@/models/ambassador";
import CensusModel from "@/models/census";
import ChapterService from "@/service/chapter";
import NotificationService from "@/service/notification";

/**
 * Annual census: once a year each chapter confirms which members are
 * still active. Anyone not confirmed is set inactive with the reason
 * given, which keeps association totals honest.
 */

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);

const CensusService = {
  /** This year's census for a chapter (null if not done yet) plus its active members. */
  async status(user: PortalAuthUser, chapterId: string, year: number) {
    await ChapterService.getAccessibleChapter(user, chapterId);
    const census = await CensusModel.findOne({ chapter: chapterId, year }).lean().exec();
    return { census, year };
  },

  /**
   * Submits the census. `removed` lists members who are no longer active,
   * each with a reason; every other active member counts as confirmed.
   */
  async submit(
    user: PortalAuthUser,
    input: { chapterId: string; year: number; removed: { memberId: string; reason: string }[] },
  ) {
    const chapter = await ChapterService.getAccessibleChapter(user, input.chapterId);
    if (input.year !== new Date().getFullYear()) throw httpError(400, "The census can only be done for the current year");
    if (await CensusModel.exists({ chapter: input.chapterId, year: input.year })) {
      throw httpError(409, `The ${input.year} census for ${chapter.name} has already been submitted`);
    }

    const active = await AmbassadorDao.list({ chapterIds: [input.chapterId], statuses: ["active"] });
    const activeIds = new Set(active.map((m) => String(m._id)));
    const removed = input.removed.filter((r) => activeIds.has(r.memberId));
    if (removed.length !== input.removed.length) throw httpError(400, "Some members are not active in this chapter");
    if (removed.length === active.length) throw httpError(400, "A chapter can't be left without members");

    for (const r of removed) {
      await AmbassadorModel.updateOne(
        { _id: r.memberId },
        { status: "inactive", statusReason: `Not confirmed in ${input.year} census: ${r.reason}` },
      ).exec();
    }
    const census = await CensusModel.create({
      chapter: chapter._id,
      church: chapter.church,
      year: input.year,
      confirmedCount: active.length - removed.length,
      removed: removed.map((r) => ({ member: r.memberId, reason: r.reason })),
      confirmedBy: user.id,
    });
    await logAudit({
      action: "created",
      entityType: "census",
      entityId: String(census._id),
      entityTitle: `${chapter.name} ${input.year}`,
      actor: { id: user.id, name: `${user.name} (${user.role})` },
      detail: `${census.confirmedCount} confirmed, ${removed.length} set inactive`,
    });
    return census;
  },

  /** Association view: which active chapters have / haven't done this year's census. */
  async progress(year: number) {
    const chapters = await ChapterDao.listAll({ status: "active" });
    const done = await CensusModel.find({ year }).lean().exec();
    const byChapter = new Map(done.map((c) => [String(c.chapter), c]));
    return chapters.map((c) => {
      const census = byChapter.get(String(c._id));
      return {
        chapterId: String(c._id),
        chapterName: c.name,
        churchName: (c.church as { name?: string })?.name ?? "",
        churchId: refId(c.church),
        done: Boolean(census),
        confirmedCount: census?.confirmedCount ?? null,
        removedCount: census?.removed.length ?? null,
        submittedAt: census?.createdAt ?? null,
      };
    });
  },

  /** Reminds every chapter that hasn't submitted this year's census. */
  async remind(year: number) {
    const pending = (await CensusService.progress(year)).filter((c) => !c.done);
    for (const c of pending) {
      await NotificationService.notifyChapterOfficers([c.chapterId], [c.churchId], {
        type: "census.reminder",
        title: `${year} census`,
        message: `Please confirm your chapter's active members for ${year}.`,
        link: "/chapter/census",
      });
    }
    return { reminded: pending.length };
  },
};

export default CensusService;
