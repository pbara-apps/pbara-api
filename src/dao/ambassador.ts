import AmbassadorModel, { type AmbassadorStatus } from "@/models/ambassador";
import mongoose from "mongoose";

export type AmbassadorFilter = {
  chapterIds?: string[];
  churchId?: string;
  statuses?: AmbassadorStatus[];
  rankId?: string;
  search?: string;
};

/** Escapes text so it can be used safely inside a RegExp. */
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildQuery(filter: AmbassadorFilter) {
  const query: Record<string, unknown> = {};
  if (filter.chapterIds) query.chapter = { $in: filter.chapterIds };
  if (filter.churchId) query.church = filter.churchId;
  if (filter.statuses?.length) query.status = { $in: filter.statuses };
  if (filter.rankId) query.rank = filter.rankId;
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
  { path: "submittedBy", select: "name role" },
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
  /** One page of members plus the total count (for large association-wide lists). */
  async listPaged(filter: AmbassadorFilter, page: number, limit: number) {
    const query = buildQuery(filter);
    const [items, total] = await Promise.all([
      AmbassadorModel.find(query)
        .populate(POPULATE)
        .sort({ fullName: 1 })
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
  async update(id: string, data: Record<string, unknown>) {
    return await AmbassadorModel.findByIdAndUpdate(id, data, { returnDocument: "after" })
      .populate(POPULATE)
      .exec();
  },
  async deleteById(id: string) {
    return await AmbassadorModel.findByIdAndDelete(id).exec();
  },
  async countByChurch(churchId: string) {
    return await AmbassadorModel.countDocuments({ church: churchId }).exec();
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
  async countActiveInChurch(churchId: string) {
    return await AmbassadorModel.countDocuments({ church: churchId, status: "active" }).exec();
  },
  /** Moves members into another chapter (same church). */
  async moveToChapter(ids: string[], chapterId: string) {
    return await AmbassadorModel.updateMany({ _id: { $in: ids } }, { $set: { chapter: chapterId } }).exec();
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
