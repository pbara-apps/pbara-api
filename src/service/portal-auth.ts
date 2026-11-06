import ChurchDao from "@/dao/church";
import PortalUserDao from "@/dao/portal-user";
import { httpError } from "@/helpers/http-error";
import ChapterService from "@/service/chapter";
import { toPublicAccount } from "@/service/portal-account";

/**
 * Builds what the portal needs after login: the account, the church,
 * and the chapters this user may switch between.
 */
async function buildProfile(userId: string) {
  const user = await PortalUserDao.findById(userId);
  if (!user || !user.isActive) throw httpError(404, "Account not found");

  const account = toPublicAccount(user);
  const church = await ChurchDao.findById(account.churchId);
  const chapters = await ChapterService.listChaptersForUser({
    id: account.id,
    name: account.name,
    email: account.email,
    role: user.role as "counsellor" | "president" | "secretary",
    churchId: account.churchId,
    chapterId: account.chapterId,
    hasChangedPassword: account.hasChangedPassword,
  });

  return {
    ...account,
    church: church ? { id: String(church._id), name: church.name } : null,
    chapters: chapters.map((c) => ({ id: String(c._id), name: c.name, isDefault: c.isDefault })),
  };
}

/**
 * Chapter portal profile. Sign-in and password changes are shared with the
 * admin portal (see service/account-auth.ts).
 */
const PortalAuthService = {
  async getProfile(userId: string) {
    return await buildProfile(userId);
  },
};

export default PortalAuthService;
