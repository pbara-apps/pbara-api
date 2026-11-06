import AccountDao from "@/dao/account";
import ExecutiveDao from "@/dao/executive";
import { issueAccountToken } from "@/helpers/account-token";
import { httpError } from "@/helpers/http-error";
import { hashPassword, verifyPassword } from "@/helpers/password-hasher";
import type { AccountDoc } from "@/models/account";
import PortalAuthService from "@/service/portal-auth";

/**
 * Sign-in for everyone (admins and chapter leaders) on one page.
 *
 * After login the portal gets one token plus what the person can open:
 * `admin` (admin portal profile) and/or `chapter` (chapter portal profile).
 * Someone with both chooses where to go.
 */

/** Checks the password, including older passwords kept after two logins were merged. */
async function passwordMatches(account: AccountDoc, password: string) {
  const withSecrets = account as AccountDoc & { password?: string; legacy_passwords?: string[] };
  if (withSecrets.password && (await verifyPassword(password, withSecrets.password))) return true;
  for (const hash of withSecrets.legacy_passwords ?? []) {
    if (await verifyPassword(password, hash)) return true;
  }
  return false;
}

const hasAdmin = (a: AccountDoc) => Boolean(a.isActive && a.admin?.active);
const hasChapter = (a: AccountDoc) => Boolean(a.isActive && a.chapterAccess?.active);

/**
 * The admin portal profile. Shaped like the old executive login response
 * (office, church, rank, title…) so the admin portal keeps working; `_id`
 * is the account id and the executive's own id is `executive_id`.
 */
async function buildAdminProfile(account: AccountDoc) {
  if (!hasAdmin(account)) return null;
  const executiveId = account.admin!.executive ? String(account.admin!.executive) : null;
  const exec = executiveId ? await ExecutiveDao.findById(executiveId) : null;
  const execData = exec ? (exec.toObject() as Record<string, unknown>) : {};
  delete execData.password;
  delete execData.role;

  return {
    ...execData,
    _id: String(account._id),
    id: String(account._id),
    executive_id: executiveId,
    name: account.name,
    email: account.email,
    phone: account.phone ?? (execData.phone as string | undefined) ?? "",
    image: (execData.image as string | null | undefined) ?? null,
    title: (execData.title as string | undefined) ?? "",
    description: (execData.description as string | undefined) ?? "",
    status: (execData.status as string | undefined) ?? "active",
    role: account.admin!.role,
    is_finance: Boolean(executiveId && account.admin!.is_finance),
    has_changed_password: account.has_changed_password,
  };
}

async function buildSession(accountId: string) {
  const account = await AccountDao.findById(accountId);
  if (!account?.isActive) throw httpError(404, "Account not found");
  const [admin, chapter] = await Promise.all([
    buildAdminProfile(account),
    hasChapter(account) ? PortalAuthService.getProfile(accountId) : Promise.resolve(null),
  ]);
  return {
    account: {
      id: String(account._id),
      name: account.name,
      email: account.email,
      phone: account.phone ?? "",
      hasChangedPassword: account.has_changed_password,
    },
    admin,
    chapter,
  };
}

const AccountAuthService = {
  /** Same message for unknown email, wrong password or no access, so nothing leaks. */
  async login(email: string, password: string) {
    const account = await AccountDao.findByEmailWithPasswords(email);
    const ok =
      account && (hasAdmin(account) || hasChapter(account)) && (await passwordMatches(account, password));
    if (!account || !ok) throw httpError(401, "Invalid email or password");

    await AccountDao.update(String(account._id), { lastLoginAt: new Date() });
    const token = issueAccountToken({ id: String(account._id), name: account.name }, hasAdmin(account));
    return { token, ...(await buildSession(String(account._id))) };
  },

  async getSession(accountId: string) {
    return await buildSession(accountId);
  },

  async getAdminProfile(accountId: string) {
    const account = await AccountDao.findById(accountId);
    const profile = account ? await buildAdminProfile(account) : null;
    if (!profile) throw httpError(404, "Profile not found");
    return profile;
  },

  /**
   * Replaces the password, clears any older merged passwords and marks
   * `has_changed_password: true`, which unlocks both portals.
   */
  async changePassword(accountId: string, currentPassword: string, newPassword: string) {
    const account = await AccountDao.findByIdWithPasswords(accountId);
    if (!account) throw httpError(404, "Account not found");
    if (!(await passwordMatches(account, currentPassword))) {
      throw httpError(400, "Your current password is incorrect");
    }
    if (currentPassword === newPassword) {
      throw httpError(400, "Choose a new password that is different from the current one");
    }
    await AccountDao.update(accountId, {
      password: await hashPassword(newPassword),
      legacy_passwords: [],
      has_changed_password: true,
    });
    return await buildSession(accountId);
  },

  /** Sets a new password from a reset link (the person has proved they own the email). */
  async setPasswordFromReset(accountId: string, newPassword: string) {
    await AccountDao.update(accountId, {
      password: await hashPassword(newPassword),
      legacy_passwords: [],
      has_changed_password: true,
    });
  },

  /**
   * Admin "My profile". Login details (name, email, phone, password) are
   * saved on the account; photo, title and bio on the linked executive
   * profile (the name is kept in step there too).
   */
  async updateAdminProfile(
    accountId: string,
    payload: {
      image?: string | null;
      name?: string;
      email?: string;
      phone?: string;
      title?: string;
      description?: string;
      password?: string;
    },
  ) {
    const account = await AccountDao.findById(accountId);
    if (!account?.admin) throw httpError(404, "Profile not found");

    const accountUpdate: Record<string, unknown> = {};
    if (payload.name !== undefined) accountUpdate.name = payload.name.trim();
    if (payload.phone !== undefined) accountUpdate.phone = payload.phone.trim();
    if (payload.email !== undefined && payload.email.trim()) {
      const email = payload.email.trim().toLowerCase();
      if (email !== account.email) {
        const taken = await AccountDao.findByEmail(email);
        if (taken) throw httpError(409, "Another account already uses this email");
        accountUpdate.email = email;
      }
    }
    if (payload.password) accountUpdate.password = await hashPassword(payload.password);
    if (Object.keys(accountUpdate).length) await AccountDao.update(accountId, accountUpdate);

    const executiveId = account.admin.executive ? String(account.admin.executive) : null;
    if (executiveId) {
      const execUpdate: Record<string, unknown> = {};
      if (payload.name !== undefined) execUpdate.name = payload.name.trim();
      if (payload.phone !== undefined) execUpdate.phone = payload.phone.trim();
      if (payload.title !== undefined) execUpdate.title = payload.title;
      if (payload.description !== undefined) execUpdate.description = payload.description;
      if (payload.image !== undefined) execUpdate.image = payload.image ?? null;
      if (Object.keys(execUpdate).length) await ExecutiveDao.updateExecutive(executiveId, execUpdate);
    }

    return await this.getAdminProfile(accountId);
  },
};

export default AccountAuthService;
