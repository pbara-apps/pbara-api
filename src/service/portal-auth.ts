import ChurchDao from "@/dao/church";
import PortalUserDao from "@/dao/portal-user";
import { httpError } from "@/helpers/http-error";
import { generateToken } from "@/helpers/jw-token";
import { hashPassword, verifyPassword } from "@/helpers/password-hasher";
import { PORTAL_TOKEN_KIND } from "@/helpers/portal-auth-user";
import ChapterService from "@/service/chapter";
import { toPublicAccount } from "@/service/portal-account";

/** Chapter portal sessions are shorter than admin ones. */
const PORTAL_TOKEN_TTL = "12h";

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

const PortalAuthService = {
  /** Same message for unknown email, wrong password or removed account, so nothing leaks. */
  async login(email: string, password: string) {
    const user = await PortalUserDao.findByEmailWithPassword(email);
    const valid = user?.isActive && (await verifyPassword(password, user.password));
    if (!user || !valid) throw httpError(401, "Invalid email or password");

    await PortalUserDao.update(String(user._id), { lastLoginAt: new Date() });
    const token = generateToken(
      { id: String(user._id), name: user.name, role: user.role, kind: PORTAL_TOKEN_KIND },
      PORTAL_TOKEN_TTL,
    );
    return { token, user: await buildProfile(String(user._id)) };
  },

  async getProfile(userId: string) {
    return await buildProfile(userId);
  },

  /**
   * Replaces the password and marks `has_changed_password: true`,
   * which unlocks the rest of the portal.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await PortalUserDao.findByIdWithPassword(userId);
    if (!user) throw httpError(404, "Account not found");
    if (!(await verifyPassword(currentPassword, user.password))) {
      throw httpError(400, "Your current password is incorrect");
    }
    if (currentPassword === newPassword) {
      throw httpError(400, "Choose a new password that is different from the current one");
    }
    await PortalUserDao.update(userId, {
      password: await hashPassword(newPassword),
      has_changed_password: true,
    });
    return await buildProfile(userId);
  },
};

export default PortalAuthService;
