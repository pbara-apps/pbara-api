import AmbassadorDao from "@/dao/ambassador";
import { logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import MeetingModel from "@/models/meeting";
import ChapterService from "@/service/chapter";

/**
 * Chapter meetings: attendance (which members were present) and a short
 * activity report. Attendance rate = meetings attended ÷ meetings held
 * since the member's record was created.
 */

export type MeetingInput = {
  chapterId: string;
  date: string;
  activity: string;
  report?: string | null;
  presentIds: string[];
  visitors?: number;
};

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);
const actorOf = (user: PortalAuthUser) => ({ id: user.id, name: `${user.name} (${user.role})` });

/** Only active members of this chapter can be marked present. */
async function checkPresent(chapterId: string, presentIds: string[]) {
  const unique = [...new Set(presentIds)];
  const members = await AmbassadorDao.findByIds(unique);
  const valid = members.filter((m) => refId(m.chapter) === chapterId && m.status === "active");
  if (valid.length !== unique.length) throw httpError(400, "Some selected people are not active members of this chapter");
  return unique;
}

async function getInScope(user: PortalAuthUser, id: string) {
  const meeting = await MeetingModel.findById(id).exec();
  if (!meeting) throw httpError(404, "Meeting not found");
  await ChapterService.resolveChapterIds(user, String(meeting.chapter));
  return meeting;
}

const MeetingService = {
  async list(user: PortalAuthUser, chapterId?: string) {
    const chapterIds = await ChapterService.resolveChapterIds(user, chapterId);
    return await MeetingModel.find({ chapter: { $in: chapterIds } })
      .populate("chapter", "name")
      .populate("recordedBy", "name role")
      .sort({ date: -1 })
      .limit(200)
      .lean()
      .exec();
  },

  async create(user: PortalAuthUser, input: MeetingInput) {
    const chapter = await ChapterService.getAccessibleChapter(user, input.chapterId);
    const present = await checkPresent(input.chapterId, input.presentIds);
    const memberCount = await AmbassadorDao.countByStatus({ chapterIds: [input.chapterId], statuses: ["active"] });
    const meeting = await MeetingModel.create({
      chapter: chapter._id,
      church: chapter.church,
      date: new Date(input.date),
      activity: input.activity,
      report: input.report?.trim() || null,
      present,
      memberCount,
      visitors: input.visitors ?? 0,
      recordedBy: user.id,
    });
    await logAudit({
      action: "created",
      entityType: "meeting",
      entityId: String(meeting._id),
      entityTitle: `${chapter.name}: ${input.activity}`,
      actor: actorOf(user),
      detail: `${present.length} of ${memberCount} present`,
    });
    return meeting;
  },

  async update(user: PortalAuthUser, id: string, input: Partial<Omit<MeetingInput, "chapterId">>) {
    const meeting = await getInScope(user, id);
    const changes: Record<string, unknown> = {};
    if (input.date) changes.date = new Date(input.date);
    if (input.activity !== undefined) changes.activity = input.activity;
    if (input.report !== undefined) changes.report = input.report?.trim() || null;
    if (input.visitors !== undefined) changes.visitors = input.visitors;
    if (input.presentIds) changes.present = await checkPresent(String(meeting.chapter), input.presentIds);
    return await MeetingModel.findByIdAndUpdate(id, changes, { returnDocument: "after" }).exec();
  },

  async remove(user: PortalAuthUser, id: string) {
    await getInScope(user, id);
    await MeetingModel.findByIdAndDelete(id).exec();
  },

  /** How many of the chapter's meetings (since the member was added) they attended. */
  async attendanceFor(user: PortalAuthUser, memberId: string) {
    const member = await AmbassadorDao.findById(memberId);
    if (!member) throw httpError(404, "Member not found");
    const chapterId = refId(member.chapter);
    await ChapterService.resolveChapterIds(user, chapterId);
    const since = member.createdAt ?? new Date(0);
    const [held, attended] = await Promise.all([
      MeetingModel.countDocuments({ chapter: chapterId, date: { $gte: since } }).exec(),
      MeetingModel.countDocuments({ chapter: chapterId, date: { $gte: since }, present: memberId }).exec(),
    ]);
    return { held, attended, rate: held ? Math.round((attended / held) * 100) : null };
  },

  /** Association view: recent meeting reports across all chapters. */
  async listAll(filter: { churchId?: string }) {
    const meetings = await MeetingModel.find(filter.churchId ? { church: filter.churchId } : {})
      .populate("chapter", "name")
      .populate("church", "name")
      .sort({ date: -1 })
      .limit(300)
      .lean()
      .exec();
    // Only the head count is needed here, not the list of who attended.
    return meetings.map(({ present, ...m }) => ({ ...m, presentCount: present.length }));
  },
};

export default MeetingService;
