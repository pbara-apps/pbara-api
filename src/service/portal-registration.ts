import AmbassadorDao from "@/dao/ambassador";
import PortalUserDao from "@/dao/portal-user";
import RegistrationDao from "@/dao/registration";
import RegistrationProgramDao from "@/dao/registration-program";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import { PORTAL_ROLE_TITLES } from "@/helpers/email-templates";
import ChapterService from "@/service/chapter";
import PaymentAccountService from "@/service/payment-account";
import RegistrationService from "@/service/registration";

/**
 * Program registration from the chapter portal.
 *
 * Instead of typing names (as on the public website form), officers pick
 * members from their chapter roster. Members still awaiting approval can
 * be registered too; their entry is marked `membership: "pending"`.
 * If that member is later rejected, the entry is flagged "non_member" and
 * admins are notified (see recruitment service).
 *
 * The registration itself goes through the normal RegistrationService, so
 * codes, deadlines, program modes and payment verification all work as before.
 */

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);

/** Programs still open for registration (active and before the deadline). */
function isOpen(program: { isActive?: boolean; registrationDeadline?: Date | null }) {
  if (!program.isActive) return false;
  return !program.registrationDeadline || new Date() <= new Date(program.registrationDeadline);
}

const PortalRegistrationService = {
  async listOpenPrograms() {
    const programs = await RegistrationProgramDao.findActive();
    return await PaymentAccountService.withPaymentAccount(programs.filter(isOpen));
  },

  /** Ids of the given chapter's members already registered for a program. */
  async registeredMemberIds(user: PortalAuthUser, programId: string, chapterId: string) {
    await ChapterService.getAccessibleChapter(user, chapterId);
    const members = await AmbassadorDao.list({ chapterIds: [chapterId], statuses: ["active", "pending"] });
    const ids = await RegistrationDao.findRegisteredAmbassadorIds(
      programId,
      members.map((m) => String(m._id)),
    );
    return [...ids];
  },

  async register(
    user: PortalAuthUser,
    input: { programId: string; chapterId: string; memberIds: string[]; proofOfPaymentUrl: string },
  ) {
    const chapter = await ChapterService.getAccessibleChapter(user, input.chapterId);
    const program = await RegistrationProgramDao.findById(input.programId);
    if (!program || !isOpen(program)) throw httpError(400, "This program is not open for registration");

    // Members must belong to this chapter and be approved or awaiting approval.
    const uniqueIds = [...new Set(input.memberIds)];
    const members = await AmbassadorDao.findByIds(uniqueIds);
    const valid = members.filter(
      (m) => refId(m.chapter) === String(chapter._id) && (m.status === "active" || m.status === "pending"),
    );
    if (valid.length !== uniqueIds.length) {
      throw httpError(400, "Some selected members are not in this chapter or can't be registered");
    }

    // No one registered twice for the same program.
    const already = await RegistrationDao.findRegisteredAmbassadorIds(input.programId, uniqueIds);
    if (already.size > 0) {
      const names = valid.filter((m) => already.has(String(m._id))).map((m) => m.fullName);
      throw httpError(409, `Already registered for this program: ${names.join(", ")}`);
    }

    // Registration type follows the program's mode.
    if (program.registrationMode === "single" && valid.length !== 1) {
      throw httpError(400, "This program only allows one person per registration");
    }
    const registrationType =
      program.registrationMode === "single" || (program.registrationMode === "both" && valid.length === 1)
        ? "single"
        : "bulk";

    const officer = await PortalUserDao.findById(user.id);
    return await RegistrationService.create({
      programId: input.programId,
      registrantName: `${user.name} (${PORTAL_ROLE_TITLES[user.role]}, ${chapter.name})`,
      registrantPhone: officer?.phone ?? "",
      proofOfPaymentUrl: input.proofOfPaymentUrl,
      registrationType,
      source: "chapter_portal",
      submittedBy: user.id,
      entries: valid.map((m) => ({
        name: m.fullName,
        rank: refId(m.rank),
        church: refId(m.church),
        ambassador: String(m._id),
        chapter: String(chapter._id),
        membership: m.status === "active" ? "member" : "pending",
      })),
    });
  },

  /** Registrations made for the user's chapters (or one chapter). */
  async listForChapters(user: PortalAuthUser, chapterId?: string) {
    const chapterIds = await ChapterService.resolveChapterIds(user, chapterId);
    return await RegistrationDao.findForChapters(chapterIds);
  },
};

export default PortalRegistrationService;
