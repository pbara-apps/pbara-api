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
  async findByChurchAndName(churchId: string, name: string) {
    return await ChapterModel.findOne({ church: churchId, name })
      .collation({ locale: "en", strength: 2 }) // case-insensitive match
      .exec();
  },
  /** Every chapter of a church, any status (for the counsellor's chapters page). */
  async findAllByChurch(churchId: string) {
    return await ChapterModel.find({ church: churchId })
      .sort({ isDefault: -1, status: 1, name: 1 })
      .exec();
  },
  /** Pending requests in a church (to stop one member being in two requests). */
  async findPendingByChurch(churchId: string) {
    return await ChapterModel.find({ church: churchId, status: "pending" }).exec();
  },
  async listAll(filter: { status?: string; churchId?: string }) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.churchId) query.church = filter.churchId;
    return await ChapterModel.find(query)
      .populate("church", "name")
      .populate("requestedBy", "name email")
      .sort({ createdAt: 1 })
      .exec();
  },
  async createRequest(data: {
    name: string;
    church: string;
    requestedBy: string;
    requestedMembers: string[];
  }) {
    return await ChapterModel.create({ ...data, status: "pending", isDefault: false });
  },
  async update(id: string, data: Record<string, unknown>) {
    return await ChapterModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).exec();
  },
  async deleteById(id: string) {
    return await ChapterModel.findByIdAndDelete(id).exec();
  },
  async updateName(id: string, name: string) {
    return await ChapterModel.findByIdAndUpdate(id, { name }, { returnDocument: "after" }).exec();
  },
  async deleteByChurch(churchId: string) {
    return await ChapterModel.deleteMany({ church: churchId }).exec();
  },
};

export default ChapterDao;
