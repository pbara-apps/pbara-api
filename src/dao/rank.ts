import RankModel from "@/models/rank";
import { RankTypes } from "@/types/_types";

/** Ranks are always listed by ladder position, then by name as a tie-breaker. */
const RANK_SORT = { order: 1, name: 1 } as const;

const RankDao = {
  async createRank(rank: RankTypes) {
    return await RankModel.create(rank);
  },
  async createRankBulk(ranks: RankTypes[]) {
    return await RankModel.insertMany(ranks);
  },
  async findAll() {
    return await RankModel.find().sort(RANK_SORT).exec();
  },
  async findPublic() {
    return await RankModel.find()
      .select("name description category image order maxAge")
      .sort(RANK_SORT)
      .exec();
  },
  /** Minimal fields needed to work out the rank ladder. */
  async findAllForOrdering() {
    return await RankModel.find()
      .select("_id name order")
      .sort(RANK_SORT)
      .lean()
      .exec();
  },
  /** Highest `order` currently in use, or 0 when there are no ordered ranks. */
  async findMaxOrder() {
    const top = await RankModel.findOne({ order: { $ne: null } })
      .sort({ order: -1 })
      .select("order")
      .lean()
      .exec();
    return top?.order ?? 0;
  },
  /** Sets order = position in the list (1-based) for every id given, in one round trip. */
  async writeOrder(ids: string[]) {
    if (ids.length === 0) return;
    await RankModel.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index + 1 } } },
      })),
    );
  },
  async findById(id: string) {
    return await RankModel.findById(id).exec();
  },
  async findByName(name: string) {
    return await RankModel.findOne({ name }).exec();
  },
  async updateRank(id: string, rank: Partial<RankTypes>) {
    return await RankModel.findByIdAndUpdate(id, rank, { returnDocument: "after" }).exec();
  },
  async deleteRank(id: string) {
    return await RankModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await RankModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countByIds(ids: string[]) {
    return await RankModel.countDocuments({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await RankModel.countDocuments().exec();
  },
};

export default RankDao;
