import AccountModel, { type AdminRole } from "@/models/account";

/** Filters for accounts whose admin / chapter access is currently usable. */
export const ACTIVE_ADMIN = { isActive: true, "admin.active": true } as const;
export const ACTIVE_CHAPTER = { isActive: true, "chapterAccess.active": true } as const;

const normaliseEmail = (email: string) => email.trim().toLowerCase();
const ids = (docs: { _id: unknown }[]) => docs.map((d) => String(d._id));

const ADMIN_POPULATE = [
  {
    path: "admin.executive",
    select: "name image office_id church_id status",
    populate: [
      { path: "office", select: "name" },
      { path: "church", select: "name chapter" },
    ],
  },
];

/** Database queries for login accounts. The password is only loaded where it is checked. */
const AccountDao = {
  async create(data: Record<string, unknown>) {
    return await AccountModel.create(data);
  },
  async findById(id: string) {
    return await AccountModel.findById(id).exec();
  },
  async findByIdWithPasswords(id: string) {
    return await AccountModel.findById(id).select("+password +legacy_passwords").exec();
  },
  async findByEmail(email: string) {
    return await AccountModel.findOne({ email: normaliseEmail(email) }).exec();
  },
  async findByEmailWithPasswords(email: string) {
    return await AccountModel.findOne({ email: normaliseEmail(email) })
      .select("+password +legacy_passwords")
      .exec();
  },
  async findByExecutive(executiveId: string) {
    return await AccountModel.findOne({ "admin.executive": executiveId }).exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await AccountModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).exec();
  },

  // ─── Admin side ──────────────────────────────────────────────────────────

  /** Every account that has (or had) admin access, with its executive profile. */
  async listAdminAccounts() {
    return await AccountModel.find({ admin: { $ne: null } })
      .populate(ADMIN_POPULATE)
      .sort({ name: 1 })
      .exec();
  },
  async findAdminAccount(id: string) {
    return await AccountModel.findOne({ _id: id, admin: { $ne: null } })
      .populate(ADMIN_POPULATE)
      .exec();
  },
  /** Ids of every active admin with the given role (e.g. all super admins). */
  async findAdminIdsByRole(role: AdminRole) {
    return ids(await AccountModel.find({ ...ACTIVE_ADMIN, "admin.role": role }).select("_id").lean().exec());
  },
  /** Ids of every active finance officer (Financial Secretary / Treasurer). */
  async findFinanceOfficerIds() {
    return ids(
      await AccountModel.find({ ...ACTIVE_ADMIN, "admin.is_finance": true }).select("_id").lean().exec(),
    );
  },
  /** Executive ids that already have a login (to hide them from "create from executive"). */
  async findLinkedExecutiveIds() {
    const docs = await AccountModel.find({ "admin.executive": { $ne: null } })
      .select("admin.executive")
      .lean()
      .exec();
    return docs.map((d) => String(d.admin?.executive));
  },

  // ─── Chapter side ────────────────────────────────────────────────────────

  /** Current counsellors with their church and member record (for the public site). */
  async listActiveCounsellors() {
    return await AccountModel.find({ ...ACTIVE_CHAPTER, "chapterAccess.role": "counsellor" })
      .select("name chapterAccess member")
      .populate([
        { path: "chapterAccess.church", select: "name chapter status image" },
        { path: "member", select: "photo memberId status" },
      ])
      .sort({ name: 1 })
      .exec();
  },
};

export default AccountDao;
