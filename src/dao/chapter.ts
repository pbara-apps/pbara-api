import ChapterModel, { CHAPTER_STATUSES } from "@/models/chapter";

/** Database queries for chapters. */
const ChapterDao = {
  async create(data: { name: string; church: string; isDefault?: boolean; status?: (typeof CHAPTER_STATUSES)[number] }) {
    return await ChapterModel.create(data);
  },
  async findById(id: string) {
    return await ChapterModel.findById(id).exec();
  },
  async findDefaultForChurch(churchId: string) {
    return await ChapterModel.findOne({ church: churchId, isDefault: true }).exec();
  },
  async findActiveByChurch(churchId: string) {
    return await ChapterModel.find({ church: churchId, status: "active" })
      .sort({ isDefault: -1, name: 1 })
      .exec();
  },
  async findByIds(ids: string[]) {
    return await ChapterModel.find({ _id: { $in: ids } })
      .populate("church", "name")
      .sort({ name: 1 })
      .exec();
  },
  async updateName(id: string, name: string) {
    return await ChapterModel.findByIdAndUpdate(id, { name }, { returnDocument: "after" }).exec();
  },
  async deleteByChurch(churchId: string) {
    return await ChapterModel.deleteMany({ church: churchId }).exec();
  },
};

export default ChapterDao;
