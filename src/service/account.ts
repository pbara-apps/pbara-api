import AccountDao from "@/dao/account";
import ExecutiveDao from "@/dao/executive";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { accessGrantedEmail, newAccountEmail } from "@/helpers/email-templates";
import { httpError } from "@/helpers/http-error";
import { sendMail } from "@/helpers/mailer";
import { hashPassword } from "@/helpers/password-hasher";
import { generateTempPassword } from "@/helpers/temp-password";
import type { AccountDoc, AdminRole, ChapterRole } from "@/models/account";

/**
 * Account service — creates logins and manages admin access.
 *
 * One account per email. Before anything is created the email is looked up:
 * - Existing account → the new access is added to it. Its id and password
 *   stay the same; the person gets an "access added" email.
 * - No account → a new one is created with a one-time password, sent by
 *   email. The person must change it the first time they sign in.
 *
 * Only super admins manage admin accounts (see routes/account.ts).
 */

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  finance: "Finance",
  viewer: "Viewer",
};

export const adminAccessTitle = (role: AdminRole) => `Admin portal (${ADMIN_ROLE_LABELS[role] ?? role})`;

/** Result of an action that may have sent a one-time password. */
export type CredentialDelivery = {
  emailSent: boolean;
  /** Only present when the email could not be sent, so it can be passed on another way. */
  temporaryPassword?: string;
};

export type AdminAccessInput = {
  role: AdminRole;
  executive?: string | null;
  is_finance?: boolean;
};

export type ChapterAccessInput = {
  role: ChapterRole;
  church: string;
  chapter: string | null;
};

const normaliseEmail = (email: string) => email.trim().toLowerCase();

async function trySend(to: string, mail: { subject: string; html: string; text?: string }) {
  try {
    await sendMail({ to, ...mail });
    return true;
  } catch (error) {
    console.error("[Account] email failed:", error);
    return false;
  }
}

/** Gives the account a new one-time password and emails it. */
async function issueTempPassword(account: AccountDoc, accessTitle: string): Promise<CredentialDelivery> {
  const tempPassword = generateTempPassword();
  await AccountDao.update(String(account._id), {
    password: await hashPassword(tempPassword),
    legacy_passwords: [],
    has_changed_password: false,
  });
  const sent = await trySend(
    account.email,
    newAccountEmail({ name: account.name, email: account.email, accessTitle, tempPassword }),
  );
  return sent ? { emailSent: true } : { emailSent: false, temporaryPassword: tempPassword };
}

/** True when the account currently has some usable access. */
const hasLiveAccess = (a: AccountDoc) => Boolean(a.isActive && (a.admin?.active || a.chapterAccess?.active));

/** Finance access needs a linked executive (Financial Secretary / Treasurer). */
function cleanAdminAccess(input: AdminAccessInput) {
  const executive = input.executive ?? null;
  return { role: input.role, executive, is_finance: Boolean(executive && input.is_finance), active: true };
}

/** Client-facing view of an account (never includes passwords). */
export function toPublicAccount(account: AccountDoc) {
  const exec = account.admin?.executive as
    | { _id?: unknown; name?: string; image?: string | null; office?: { name?: string }; church?: { name?: string } }
    | null
    | undefined;
  const execId = exec && typeof exec === "object" && "_id" in exec ? String(exec._id) : exec ? String(exec) : null;
  return {
    id: String(account._id),
    name: account.name,
    email: account.email,
    phone: account.phone ?? "",
    hasChangedPassword: account.has_changed_password,
    isActive: account.isActive,
    lastLoginAt: account.lastLoginAt ?? null,
    memberId: account.member ? String(account.member) : null,
    admin: account.admin
      ? {
          role: account.admin.role,
          isFinance: Boolean(account.admin.executive && account.admin.is_finance),
          active: account.admin.active,
          executiveId: execId,
          executive:
            exec && typeof exec === "object" && "name" in exec
              ? {
                  id: execId,
                  name: exec.name ?? "",
                  image: exec.image ?? null,
                  office: exec.office?.name ?? "",
                  church: exec.church?.name ?? "",
                }
              : null,
        }
      : null,
    chapterAccess: account.chapterAccess
      ? {
          role: account.chapterAccess.role,
          churchId: String(account.chapterAccess.church),
          chapterId: account.chapterAccess.chapter ? String(account.chapterAccess.chapter) : null,
          active: account.chapterAccess.active,
        }
      : null,
  };
}

/**
 * Finds the account for this email (or creates one) and gives it the
 * requested access. Throws 409 if the account already has that kind of
 * access in use (the caller decides how to word that).
 */
export async function upsertAccountWithAccess(opts: {
  name: string;
  email: string;
  phone?: string | null;
  admin?: AdminAccessInput;
  chapterAccess?: ChapterAccessInput;
  member?: string | null;
  /** Shown in the email, e.g. "Counsellor of First Baptist Church". */
  accessTitle: string;
  /** Message for the 409 when the access is already in use. */
  conflictMessage?: (existing: AccountDoc) => string;
}): Promise<{ account: AccountDoc; created: boolean } & CredentialDelivery> {
  const email = normaliseEmail(opts.email);
  const existing = await AccountDao.findByEmail(email);

  if (existing) {
    const busy =
      (opts.admin && existing.isActive && existing.admin?.active) ||
      (opts.chapterAccess && existing.isActive && existing.chapterAccess?.active);
    if (busy) {
      throw httpError(409, opts.conflictMessage?.(existing) ?? "This email already has that access");
    }

    const wasLive = hasLiveAccess(existing);
    const set: Record<string, unknown> = { isActive: true };
    if (opts.admin) set.admin = cleanAdminAccess(opts.admin);
    if (opts.chapterAccess) set.chapterAccess = { ...opts.chapterAccess, active: true };
    if (opts.member && !existing.member) set.member = opts.member;
    if (opts.phone && !existing.phone) set.phone = opts.phone.trim();
    const updated = (await AccountDao.update(String(existing._id), set))!;

    // Someone who had no working access may not remember their password: start fresh.
    if (!wasLive) {
      const delivery = await issueTempPassword(updated, opts.accessTitle);
      return { account: updated, created: false, ...delivery };
    }
    const sent = await trySend(
      updated.email,
      accessGrantedEmail({ name: updated.name, email: updated.email, accessTitle: opts.accessTitle }),
    );
    return { account: updated, created: false, emailSent: sent };
  }

  const tempPassword = generateTempPassword();
  const account = await AccountDao.create({
    name: opts.name.trim(),
    email,
    phone: opts.phone?.trim() || null,
    password: await hashPassword(tempPassword),
    has_changed_password: false,
    admin: opts.admin ? cleanAdminAccess(opts.admin) : null,
    chapterAccess: opts.chapterAccess ? { ...opts.chapterAccess, active: true } : null,
    member: opts.member ?? null,
  });
  const sent = await trySend(
    email,
    newAccountEmail({ name: account.name, email, accessTitle: opts.accessTitle, tempPassword }),
  );
  return {
    account,
    created: true,
    ...(sent ? { emailSent: true } : { emailSent: false, temporaryPassword: tempPassword }),
  };
}

/** Re-sends a one-time password (e.g. the person never received or lost it). */
export async function resendTempPassword(accountId: string, accessTitle: string) {
  const account = await AccountDao.findById(accountId);
  if (!account) throw httpError(404, "Account not found");
  return await issueTempPassword(account, accessTitle);
}

async function getAdminAccountOrThrow(id: string) {
  const account = await AccountDao.findAdminAccount(id);
  if (!account?.admin) throw httpError(404, "Account not found");
  return account;
}

async function getExecutiveOrThrow(id: string) {
  const executive = await ExecutiveDao.findById(id);
  if (!executive) throw httpError(404, "Executive not found");
  return executive;
}

/** Super admins can't lock themselves (or the association) out. */
async function assertNotLastSuperAdmin(account: AccountDoc, actorId?: string) {
  if (account.admin?.role !== "super_admin") return;
  if (String(account._id) === actorId) {
    throw httpError(400, "You can't remove your own super admin access");
  }
  const superAdmins = await AccountDao.findAdminIdsByRole("super_admin");
  if (superAdmins.length <= 1) throw httpError(400, "There must be at least one super admin");
}

const AccountService = {
  async listAdminAccounts() {
    const accounts = await AccountDao.listAdminAccounts();
    return accounts.map(toPublicAccount);
  },

  /** Executives without a login yet (for "create from executive"). */
  async listExecutivesWithoutAccount() {
    const [executives, linked] = await Promise.all([
      ExecutiveDao.findAll(),
      AccountDao.findLinkedExecutiveIds(),
    ]);
    const taken = new Set(linked);
    return executives
      .filter((e) => !taken.has(String(e._id)))
      .map((e) => ({
        id: String(e._id),
        name: e.name,
        email: e.email ?? "",
        phone: e.phone ?? "",
        image: e.image ?? null,
        office: (e as unknown as { office?: { name?: string } }).office?.name ?? "",
        status: e.status,
      }));
  },

  /**
   * Creates an admin login. Either pick an executive (name, email and phone
   * come from their profile) or enter the details by hand.
   */
  async createAdminAccount(
    input: {
      executiveId?: string | null;
      name?: string;
      email?: string;
      phone?: string;
      role: AdminRole;
      is_finance?: boolean;
    },
    actor: AuditActor,
  ) {
    let name = input.name?.trim() ?? "";
    let email = input.email?.trim() ?? "";
    let phone = input.phone?.trim() ?? "";
    let executive: string | null = null;

    if (input.executiveId) {
      const exec = await getExecutiveOrThrow(input.executiveId);
      const alreadyLinked = await AccountDao.findByExecutive(input.executiveId);
      if (alreadyLinked) throw httpError(409, `${exec.name} already has a login`);
      executive = String(exec._id);
      name = exec.name;
      email = email || exec.email || "";
      phone = phone || exec.phone || "";
      // Keep the executive profile's email filled in if it was empty.
      if (!exec.email && email) await ExecutiveDao.updateExecutive(executive, { email });
    }
    if (!name || name.length < 2) throw httpError(400, "Enter the person's name");
    if (!email) throw httpError(400, "An email address is needed to send the login details");

    const result = await upsertAccountWithAccess({
      name,
      email,
      phone,
      admin: { role: input.role, executive, is_finance: input.is_finance },
      accessTitle: adminAccessTitle(input.role),
      conflictMessage: (a) => `${a.name} (${a.email}) already has admin access`,
    });

    await logAudit({
      action: result.created ? "created" : "updated",
      entityType: "portal_account",
      entityId: String(result.account._id),
      entityTitle: result.account.name,
      actor,
      detail: `Admin access given (${ADMIN_ROLE_LABELS[input.role]})${result.created ? "" : " to an existing account"}`,
    });

    const full = await AccountDao.findAdminAccount(String(result.account._id));
    return {
      account: toPublicAccount(full!),
      created: result.created,
      emailSent: result.emailSent,
      temporaryPassword: result.temporaryPassword,
    };
  },

  /** Changes role, finance access, linked executive, or turns admin access off/on. */
  async updateAdminAccess(
    id: string,
    changes: { role?: AdminRole; is_finance?: boolean; active?: boolean; executiveId?: string | null },
    actor: AuditActor,
  ) {
    const account = await getAdminAccountOrThrow(id);
    const current = account.admin!;
    const execRef = current.executive as unknown as { _id?: unknown } | null;
    let executive = execRef ? String(execRef._id ?? execRef) : null;

    if (changes.executiveId !== undefined) {
      if (changes.executiveId) {
        await getExecutiveOrThrow(changes.executiveId);
        const other = await AccountDao.findByExecutive(changes.executiveId);
        if (other && String(other._id) !== id) throw httpError(409, "That executive already has a login");
      }
      executive = changes.executiveId || null;
    }

    const losingSuperAdmin =
      current.role === "super_admin" &&
      ((changes.role && changes.role !== "super_admin") || changes.active === false);
    if (losingSuperAdmin) await assertNotLastSuperAdmin(account, actor.id);

    const wantsFinance = changes.is_finance ?? current.is_finance;
    if (changes.is_finance && !executive) {
      throw httpError(400, "Only accounts linked to an executive (Financial Secretary or Treasurer) can be finance officers");
    }

    const role = changes.role ?? current.role;
    const active = changes.active ?? current.active;
    await AccountDao.update(id, {
      admin: { role, executive, is_finance: Boolean(executive && wantsFinance), active },
    });

    const notes: string[] = [];
    if (changes.role && changes.role !== current.role) notes.push(`role → ${ADMIN_ROLE_LABELS[role]}`);
    if (changes.is_finance !== undefined && changes.is_finance !== current.is_finance) {
      notes.push(changes.is_finance ? "finance access given" : "finance access removed");
    }
    if (changes.active !== undefined && changes.active !== current.active) {
      notes.push(changes.active ? "admin access restored" : "admin access removed");
    }
    if (changes.executiveId !== undefined) notes.push(executive ? "linked to executive" : "executive unlinked");

    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: id,
      entityTitle: account.name,
      actor,
      detail: notes.length ? `Admin access: ${notes.join(", ")}` : "Admin access saved",
    });

    return toPublicAccount((await AccountDao.findAdminAccount(id))!);
  },

  async resendAdminPassword(id: string, actor: AuditActor) {
    const account = await getAdminAccountOrThrow(id);
    const delivery = await resendTempPassword(id, adminAccessTitle(account.admin!.role));
    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: id,
      entityTitle: account.name,
      actor,
      detail: "One-time password re-sent",
    });
    return delivery;
  },
};

export default AccountService;
