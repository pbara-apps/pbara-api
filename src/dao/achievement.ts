import AchievementModel from "@/models/achievement";

const POPULATE = [
  { path: "chapter", select: "name" },
  { path: "church", select: "name" },
  { path: "createdBy", select: "name role" },
];

/** Database queries for chapter achievements. Newest (by month/year) first. */
const AchievementDao = {
  async create(data: Record<string, unknown>) {
    return await AchievementModel.create(data);
  },
  async findById(id: string) {
    return await AchievementModel.findById(id).exec();
  },
  async list(filter: { chapterIds?: string[]; churchId?: string; year?: number }) {
    const query: Record<string, unknown> = {};
    if (filter.chapterIds) query.chapter = { $in: filter.chapterIds };
    if (filter.churchId) query.church = filter.churchId;
    if (filter.year) query.year = filter.year;
    return await AchievementModel.find(query)
      .populate(POPULATE)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await AchievementModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).populate(POPULATE).exec();
  },
  async deleteById(id: string) {
    return await AchievementModel.findByIdAndDelete(id).exec();
  },
};

export default AchievementDao;
