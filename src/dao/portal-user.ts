import { ACTIVE_CHAPTER } from "@/dao/account";
import AccountModel, { type AccountDoc, type ChapterRole } from "@/models/account";

/**
 * Chapter portal logins (counsellors, presidents, secretaries).
 *
 * These live on the shared Account model as `chapterAccess`. This module
 * shows each account with chapter access as a flat "portal user", so the
 * chapter services don't need to know about the rest of the account.
 *
 * `isActive` here means "can use the chapter portal": the account is active
 * AND its chapter access is active. Setting `isActive: false` through
 * `update` only removes chapter access; any admin access the person has stays.
 */
export type PortalRole = ChapterRole;

export type PortalUserView = {
  _id: AccountDoc["_id"];
  name: string;
  email: string;
  phone: string;
  role: PortalRole;
  church: unknown;
  chapter: unknown | null;
  isActive: boolean;
  has_changed_password: boolean;
  lastLoginAt: Date | null;
  member: unknown | null;
  aliases: string[];
  password?: string;
  legacy_passwords?: string[];
};

const HAS_CHAPTER = { chapterAccess: { $ne: null } } as const;

function toView(doc: AccountDoc | null): PortalUserView | null {
  if (!doc?.chapterAccess) return null;
  const access = doc.chapterAccess;
  return {
    _id: doc._id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    role: access.role as PortalRole,
    church: access.church,
    chapter: access.chapter ?? null,
    isActive: Boolean(doc.isActive && access.active),
    has_changed_password: doc.has_changed_password,
    lastLoginAt: doc.lastLoginAt ?? null,
    member: doc.member ?? null,
    aliases: (doc.aliases ?? []).map(String),
    password: (doc as { password?: string }).password,
    legacy_passwords: (doc as { legacy_passwords?: string[] }).legacy_passwords,
  };
}

/** Maps flat portal-user fields onto the account document. */
function toAccountUpdate(data: Record<string, unknown>) {
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "isActive") set["chapterAccess.active"] = value;
    else if (key === "role" || key === "church" || key === "chapter") set[`chapterAccess.${key}`] = value;
    else set[key] = value;
  }
  return set;
}

const ids = (docs: { _id: unknown }[]) => docs.map((d) => String(d._id));

const PortalUserDao = {
  async findById(id: string) {
    return toView(await AccountModel.findOne({ _id: id, ...HAS_CHAPTER }).exec());
  },
  async findByIdWithPassword(id: string) {
    return toView(
      await AccountModel.findOne({ _id: id, ...HAS_CHAPTER }).select("+password +legacy_passwords").exec(),
    );
  },
  /** The current counsellor of a church, if any. */
  async findActiveCounsellor(churchId: string) {
    return toView(
      await AccountModel.findOne({
        ...ACTIVE_CHAPTER,
        "chapterAccess.role": "counsellor",
        "chapterAccess.church": churchId,
      }).exec(),
    );
  },
  /** The current president or secretary of a chapter, if any. */
  async findActiveChapterOfficer(chapterId: string, role: PortalRole) {
    return toView(
      await AccountModel.findOne({
        ...ACTIVE_CHAPTER,
        "chapterAccess.role": role,
        "chapterAccess.chapter": chapterId,
      }).exec(),
    );
  },
  /** Active president/secretary accounts for the given chapters. */
  async findActiveOfficersForChapters(chapterIds: string[]) {
    const docs = await AccountModel.find({
      ...ACTIVE_CHAPTER,
      "chapterAccess.chapter": { $in: chapterIds },
      "chapterAccess.role": { $in: ["president", "secretary"] },
    })
      .sort({ "chapterAccess.role": 1 })
      .exec();
    return docs.map(toView).filter((v): v is PortalUserView => v !== null);
  },
  /**
   * Active accounts that look after the given chapters: their presidents and
   * secretaries plus the counsellor of each chapter's church.
   */
  async findActiveIdsForChapters(chapterIds: string[], churchIds: string[]) {
    const docs = await AccountModel.find({
      ...ACTIVE_CHAPTER,
      $or: [
        { "chapterAccess.chapter": { $in: chapterIds } },
        { "chapterAccess.role": "counsellor", "chapterAccess.church": { $in: churchIds } },
      ],
    })
      .select("_id")
      .lean()
      .exec();
    return ids(docs);
  },
  /** Active portal accounts in the given churches (or every church). */
  async findActiveIdsByChurches(churchIds: string[] | "all") {
    const docs = await AccountModel.find({
      ...ACTIVE_CHAPTER,
      ...(churchIds === "all" ? {} : { "chapterAccess.church": { $in: churchIds } }),
    })
      .select("_id")
      .lean()
      .exec();
    return ids(docs);
  },
  /** Removes chapter access for every account in a church (used when the church is deleted). */
  async deactivateByChurch(churchId: string) {
    return await AccountModel.updateMany(
      { "chapterAccess.church": churchId },
      { $set: { "chapterAccess.active": false } },
    ).exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return toView(
      await AccountModel.findByIdAndUpdate(id, { $set: toAccountUpdate(data) }, { returnDocument: "after" }).exec(),
    );
  },
};

export default PortalUserDao;
