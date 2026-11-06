/**
 * One-off move from the old separate logins to shared Accounts.
 *
 *   npm run migrate:accounts            → dry run: prints what would happen, changes nothing
 *   npm run migrate:accounts -- --apply → does it
 *
 * What it does:
 * 1. Every executive that had a login (email + password) becomes an Account
 *    with admin access. The account keeps the executive's id, password and role.
 * 2. Every chapter login (PortalUser) becomes chapter access:
 *    - same email as an admin account → merged into that account. The
 *      account keeps the admin id; the chapter login's id is kept as an
 *      alias and its password keeps working until the first password change.
 *    - otherwise → a new Account that keeps the chapter login's id and password.
 * 3. Current counsellors get a counsellor member record (with a member ID).
 * 4. Current presidents/secretaries are linked to their member record when
 *    exactly one member in their chapter has the same name.
 * 5. Every moved account must set a new password on first sign-in.
 *
 * Safe to run again: people who already have an Account are skipped.
 * The old portalusers collection is left untouched as a backup. In --apply
 * mode every executive loses its old password/role fields.
 *
 * Emails are NOT sent here: run `npm run email:restructure` afterwards.
 */
import "dotenv/config";
import connectDB from "@/config/db_config";
import CounterDao from "@/dao/counter";
import { cleanName, formatMemberId, toNameKey } from "@/helpers/member-utils";
import AccountModel from "@/models/account";
import AmbassadorModel from "@/models/ambassador";
import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");

type RawExecutive = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  role?: string | null;
  is_finance?: boolean;
};

type RawPortalUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  role: "counsellor" | "president" | "secretary";
  church: mongoose.Types.ObjectId;
  chapter?: mongoose.Types.ObjectId | null;
  isActive?: boolean;
  lastLoginAt?: Date | null;
};

type PlannedAccount = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string | null;
  password: string;
  legacy_passwords: string[];
  has_changed_password: false;
  isActive: true;
  lastLoginAt: Date | null;
  admin: { role: string; executive: mongoose.Types.ObjectId; is_finance: boolean; active: boolean } | null;
  chapterAccess: {
    role: string;
    church: mongoose.Types.ObjectId;
    chapter: mongoose.Types.ObjectId | null;
    active: boolean;
  } | null;
  member: mongoose.Types.ObjectId | null;
  aliases: mongoose.Types.ObjectId[];
  migration: { migratedAt: Date; merged: boolean; emailSentAt: null };
};

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "finance", "viewer"]);
const norm = (email?: string | null) => (email ?? "").trim().toLowerCase();
const later = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a > b ? a : b);

async function main() {
  await connectDB();
  const db = mongoose.connection.db!;
  const now = new Date();

  const executives = (await db
    .collection("executives")
    .find({}, { projection: { name: 1, email: 1, phone: 1, password: 1, role: 1, is_finance: 1 } })
    .toArray()) as unknown as RawExecutive[];
  const portalUsers = (await db.collection("portalusers").find({}).toArray()) as unknown as RawPortalUser[];

  const existing = await AccountModel.find({}).select("_id email aliases").lean().exec();
  const existingIds = new Set(existing.flatMap((a) => [String(a._id), ...(a.aliases ?? []).map(String)]));
  const existingEmails = new Set(existing.map((a) => a.email));

  const planned = new Map<string, PlannedAccount>(); // by email
  const report = {
    executivesMoved: [] as string[],
    executivesSkipped: [] as string[],
    chapterMoved: [] as string[],
    merged: [] as string[],
    alreadyMigrated: [] as string[],
    counsellorMembers: [] as string[],
    officersLinked: [] as string[],
    officersNotLinked: [] as string[],
  };

  // 1. Admin logins from executives.
  for (const e of executives) {
    const email = norm(e.email);
    if (!e.password) continue; // never had a login
    if (!email) {
      report.executivesSkipped.push(`${e.name} — has a password but no email, so can't sign in`);
      continue;
    }
    if (existingIds.has(String(e._id)) || existingEmails.has(email)) {
      report.alreadyMigrated.push(`${e.name} <${email}>`);
      continue;
    }
    if (planned.has(email)) {
      report.executivesSkipped.push(`${e.name} <${email}> — another executive already uses this email`);
      continue;
    }
    planned.set(email, {
      _id: e._id,
      name: e.name,
      email,
      phone: e.phone ?? null,
      password: e.password,
      legacy_passwords: [],
      has_changed_password: false,
      isActive: true,
      lastLoginAt: null,
      admin: {
        role: e.role && ADMIN_ROLES.has(e.role) ? e.role : "admin",
        executive: e._id,
        is_finance: Boolean(e.is_finance),
        active: true,
      },
      chapterAccess: null,
      member: null,
      aliases: [],
      migration: { migratedAt: now, merged: false, emailSentAt: null },
    });
    report.executivesMoved.push(`${e.name} <${email}> (${e.role ?? "admin"})`);
  }

  // 2. Chapter logins.
  for (const p of portalUsers) {
    const email = norm(p.email);
    if (existingIds.has(String(p._id)) || existingEmails.has(email)) {
      report.alreadyMigrated.push(`${p.name} <${email}> (${p.role})`);
      continue;
    }
    const access = { role: p.role, church: p.church, chapter: p.chapter ?? null, active: p.isActive !== false };
    const admin = planned.get(email);
    if (admin) {
      admin.chapterAccess = access;
      admin.aliases.push(p._id);
      if (p.password !== admin.password) admin.legacy_passwords.push(p.password);
      admin.lastLoginAt = later(admin.lastLoginAt, p.lastLoginAt ?? null);
      admin.migration.merged = true;
      report.merged.push(`${admin.name} <${email}>: admin + ${p.role}${access.active ? "" : " (inactive)"}`);
      continue;
    }
    planned.set(email, {
      _id: p._id,
      name: p.name,
      email,
      phone: p.phone ?? null,
      password: p.password,
      legacy_passwords: [],
      has_changed_password: false,
      isActive: true,
      lastLoginAt: p.lastLoginAt ?? null,
      admin: null,
      chapterAccess: access,
      member: null,
      aliases: [],
      migration: { migratedAt: now, merged: false, emailSentAt: null },
    });
    report.chapterMoved.push(`${p.name} <${email}> (${p.role}${access.active ? "" : ", inactive"})`);
  }

  // 3–4. Member records for current chapter leaders.
  const newMembers: Record<string, unknown>[] = [];
  for (const account of planned.values()) {
    const access = account.chapterAccess;
    if (!access?.active) continue;

    if (access.role === "counsellor") {
      const memberDocId = new mongoose.Types.ObjectId();
      account.member = memberDocId;
      newMembers.push({
        _id: memberDocId,
        memberType: "counsellor",
        fullName: cleanName(account.name),
        nameKey: toNameKey(account.name),
        phone: account.phone,
        church: access.church,
        chapter: null,
        rank: null,
        status: "active",
        approvedAt: now,
        reviewedAt: now,
      });
      report.counsellorMembers.push(`${account.name}`);
      continue;
    }

    if (access.chapter) {
      const matches = await AmbassadorModel.find({
        chapter: access.chapter,
        nameKey: toNameKey(account.name),
        memberType: { $ne: "counsellor" },
        status: { $nin: ["rejected", "transferred"] },
      })
        .select("_id fullName")
        .lean()
        .exec();
      if (matches.length === 1) {
        account.member = matches[0]._id as mongoose.Types.ObjectId;
        report.officersLinked.push(`${account.name} (${access.role})`);
      } else {
        report.officersNotLinked.push(
          `${account.name} (${access.role}) — ${matches.length === 0 ? "no member with this name in the chapter" : `${matches.length} members share this name`}`,
        );
      }
    }
  }

  // Report.
  const section = (title: string, rows: string[]) => {
    console.log(`\n${title}: ${rows.length}`);
    rows.forEach((r) => console.log(`  - ${r}`));
  };
  console.log(APPLY ? "=== APPLYING account migration ===" : "=== DRY RUN (nothing is changed; add --apply to run) ===");
  section("Admin logins moved (from executives)", report.executivesMoved);
  section("Chapter logins moved", report.chapterMoved);
  section("Merged (same email had both logins)", report.merged);
  section("Counsellor member records to create", report.counsellorMembers);
  section("Presidents/secretaries linked to their member record", report.officersLinked);
  section("Presidents/secretaries NOT linked (counsellor can re-pick them later)", report.officersNotLinked);
  section("Skipped executives", report.executivesSkipped);
  section("Already migrated (skipped)", report.alreadyMigrated);

  if (!APPLY) {
    await mongoose.disconnect();
    return;
  }

  // Apply.
  for (const m of newMembers) {
    m.memberId = formatMemberId(await CounterDao.next("member-id"));
  }
  if (newMembers.length) await AmbassadorModel.insertMany(newMembers);
  const accounts = [...planned.values()];
  if (accounts.length) await AccountModel.insertMany(accounts);

  // Executives are profiles only now: clear old login fields from ALL of them
  // (including ones that couldn't be moved, e.g. no email), so no password
  // hash is left on a record that the public site reads.
  await db
    .collection("executives")
    .updateMany({}, { $unset: { password: "", role: "", is_finance: "" } });
  // Old reset links pointed at executives; they expire in 30 minutes anyway.
  await db.collection("passwordresets").deleteMany({ executive: { $exists: true } });

  console.log(`\nDone: ${accounts.length} accounts and ${newMembers.length} counsellor member records created.`);
  console.log("Next: npm run email:restructure (dry run) → npm run email:restructure -- --send");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
