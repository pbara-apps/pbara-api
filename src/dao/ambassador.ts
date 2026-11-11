import { ACTOR_SELECT } from "@/models/account";
import AmbassadorModel, { type AmbassadorStatus, type MemberType } from "@/models/ambassador";
import mongoose, { type ClientSession } from "mongoose";

export type AmbassadorFilter = {
  ids?: string[];
  chapterIds?: string[];
  churchId?: string;
  statuses?: AmbassadorStatus[];
  rankId?: string;
  search?: string;
  memberType?: MemberType;
};

/** Escapes text so it can be used safely inside a RegExp. */
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildQuery(filter: AmbassadorFilter) {
  const query: Record<string, unknown> = {};
  if (filter.ids) query._id = { $in: filter.ids };
  if (filter.chapterIds) query.chapter = { $in: filter.chapterIds };
  if (filter.churchId) query.church = filter.churchId;
  if (filter.statuses?.length) query.status = { $in: filter.statuses };
  if (filter.rankId) query.rank = filter.rankId;
  if (filter.memberType === "ambassador") query.memberType = { $ne: "counsellor" };
  else if (filter.memberType) query.memberType = filter.memberType;
  if (filter.search?.trim()) {
    const pattern = new RegExp(escapeRegex(filter.search.trim()), "i");
    query.$or = [{ fullName: pattern }, { memberId: pattern }];
  }
  return query;
}

const POPULATE = [
  { path: "rank", select: "name order image maxAge" },
  { path: "chapter", select: "name" },
  { path: "church", select: "name" },
  { path: "submittedBy", select: ACTOR_SELECT },
  { path: "rankHistory.rank", select: "name order image" },
];

/** Database queries for ambassador (member) records. */
const AmbassadorDao = {
  async createMany(docs: Record<string, unknown>[]) {
    return await AmbassadorModel.insertMany(docs);
  },
  async findById(id: string) {
    return await AmbassadorModel.findById(id).populate(POPULATE).exec();
  },
  async findByIds(ids: string[]) {
    return await AmbassadorModel.find({ _id: { $in: ids } }).exec();
  },
  /**
   * The members in `ids` that are still pending, oldest submission first
   * (so earlier submissions get lower member IDs). Only the fields approval needs.
   */
  async findPendingByIds(ids: string[], session?: ClientSession) {
    return await AmbassadorModel.find({ _id: { $in: ids }, status: "pending" })
      .select("fullName chapter church")
      .sort({ createdAt: 1, _id: 1 })
      .session(session ?? null)
      .exec();
  },
  /**
   * Approves members in one bulk write. Each update only applies while the
   * member is still pending; returns how many were changed.
   */
  async approveMany(
    approvals: { id: string; memberId: string }[],
    review: { reviewedBy: string | null; at: Date },
    session?: ClientSession,
  ) {
    const { ObjectId } = mongoose.Types;
    const reviewedBy = review.reviewedBy ? new ObjectId(review.reviewedBy) : null;
    const result = await AmbassadorModel.bulkWrite(
      approvals.map(({ id, memberId }) => ({
        updateOne: {
          filter: { _id: new ObjectId(id), status: "pending" as const },
          update: {
            $set: {
              status: "active" as const,
              memberId,
              changesRequested: false,
              reviewNote: null,
              reviewedBy,
              reviewedAt: review.at,
              approvedAt: review.at,
            },
          },
        },
      })),
      { session },
    );
    return result.modifiedCount;
  },
  /** One page of members plus the total count (for large association-wide lists). */
  async listPaged(
    filter: AmbassadorFilter,
    page: number,
    limit: number,
    sort: Record<string, 1 | -1> = { fullName: 1 },
  ) {
    const query = buildQuery(filter);
    const [items, total] = await Promise.all([
      AmbassadorModel.find(query)
        .populate(POPULATE)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      AmbassadorModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  },
  async list(filter: AmbassadorFilter, sort: Record<string, 1 | -1> = { fullName: 1 }) {
    return await AmbassadorModel.find(buildQuery(filter))
      .populate(POPULATE)
      .sort(sort)
      .exec();
  },
  /**
   * Possible duplicates for the duplicate check: every non-rejected
   * record whose normalised name is in `nameKeys`.
   */
  async findByNameKeys(nameKeys: string[]) {
    return await AmbassadorModel.find({
      nameKey: { $in: nameKeys },
      status: { $ne: "rejected" },
    })
      .populate([
        { path: "chapter", select: "name" },
        { path: "church", select: "name" },
      ])
      .exec();
  },
  /** Only the fields the duplicate check compares, for members matching the filter. */
  async listMatchFields(filter: AmbassadorFilter) {
    return await AmbassadorModel.find(buildQuery(filter)).select("nameKey dateOfBirth").lean().exec();
  },
  /** Same as `findByNameKeys`, but only the fields the duplicate check compares. */
  async findMatchFieldsByNameKeys(nameKeys: string[]) {
    return await AmbassadorModel.find({ nameKey: { $in: nameKeys }, status: { $ne: "rejected" } })
      .select("nameKey dateOfBirth")
      .lean()
      .exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await AmbassadorModel.findByIdAndUpdate(id, data, { returnDocument: "after" })
      .populate(POPULATE)
      .exec();
  },
  async deleteById(id: string) {
    return await AmbassadorModel.findByIdAndDelete(id).exec();
  },
  /** Ambassadors in a church (used to block deleting a church that has members). */
  async countByChurch(churchId: string) {
    return await AmbassadorModel.countDocuments({ church: churchId, memberType: { $ne: "counsellor" } }).exec();
  },
  /** Creates one member record directly (e.g. a counsellor). */
  async create(doc: Record<string, unknown>) {
    return await AmbassadorModel.create(doc);
  },
  /** Counsellor member records of a church (used when the church is removed). */
  async deactivateCounsellorsOfChurch(churchId: string, reason: string) {
    return await AmbassadorModel.updateMany(
      { church: churchId, memberType: "counsellor", status: "active" },
      { status: "inactive", statusReason: reason },
    ).exec();
  },
  async countByStatus(filter: AmbassadorFilter) {
    return await AmbassadorModel.countDocuments(buildQuery(filter)).exec();
  },
  /** Active member count per chapter, as a Map of chapterId → count. */
  async countActiveByChapters(chapterIds: string[]) {
    const rows = await AmbassadorModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          chapter: { $in: chapterIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: "active",
        },
      },
      { $group: { _id: "$chapter", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
  },
  /** Active member count per church, as a Map of churchId → count. */
  async countActiveByChurches(churchIds: string[]) {
    const rows = await AmbassadorModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          church: { $in: churchIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: "active",
        },
      },
      { $group: { _id: "$church", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
  },
  async countActiveInChurch(churchId: string) {
    return await AmbassadorModel.countDocuments({ church: churchId, status: "active" }).exec();
  },
  /**
   * Moves members into another chapter, recording the move in each
   * member's chapter history. `churchId` changes too for cross-church moves.
   */
  async moveToChapter(ids: string[], chapterId: string, churchId?: string) {
    const members = await AmbassadorModel.find({ _id: { $in: ids } }).select("chapter").exec();
    const movedAt = new Date();
    const toChapter = new mongoose.Types.ObjectId(chapterId);
    const set = churchId
      ? { chapter: toChapter, church: new mongoose.Types.ObjectId(churchId) }
      : { chapter: toChapter };
    await Promise.all(
      members.map((m) =>
        AmbassadorModel.updateOne(
          { _id: m._id },
          { $set: set, $push: { chapterHistory: { fromChapter: m.chapter, toChapter, movedAt } } },
        ).exec(),
      ),
    );
  },
  async findBasicByIds(ids: string[]) {
    return await AmbassadorModel.find({ _id: { $in: ids } })
      .select("fullName memberId photo status chapter church rank")
      .populate([
        { path: "chapter", select: "name" },
        { path: "rank", select: "name" },
      ])
      .exec();
  },
  /** Active members per rank across the whole association. */
  async countAllActiveByRank() {
    return await AmbassadorModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$rank", count: { $sum: 1 } } },
    ]);
  },
  /** Members approved per month since `from`, as [{ year, month, count }]. */
  async countApprovedByMonth(from: Date) {
    return await AmbassadorModel.aggregate<{ _id: { year: number; month: number }; count: number }>([
      { $match: { approvedAt: { $gte: from } } },
      { $group: { _id: { year: { $year: "$approvedAt" }, month: { $month: "$approvedAt" } }, count: { $sum: 1 } } },
    ]);
  },
  async countChangesRequested(chapterIds: string[]) {
    return await AmbassadorModel.countDocuments({
      chapter: { $in: chapterIds },
      status: "pending",
      changesRequested: true,
    }).exec();
  },
  /** Active member count per rank for the given chapters. */
  async countActiveByRank(chapterIds: string[]) {
    return await AmbassadorModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          chapter: { $in: chapterIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: "active",
        },
      },
      { $group: { _id: "$rank", count: { $sum: 1 } } },
    ]);
  },
  /** Active members (in the given chapters) whose birthday falls in `month` (1-12). */
  async findBirthdaysInMonth(chapterIds: string[], month: number) {
    return await AmbassadorModel.find({
      chapter: { $in: chapterIds },
      status: "active",
      dateOfBirth: { $ne: null },
      $expr: { $eq: [{ $month: "$dateOfBirth" }, month] },
    })
      .select("fullName dateOfBirth photo memberId")
      .sort({ fullName: 1 })
      .exec();
  },
};

export default AmbassadorDao;
