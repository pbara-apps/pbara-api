import PortalUserModel, { type PortalRole } from "@/models/portal-user";

/** Database queries for chapter portal accounts. The password is only loaded where it is checked. */
const PortalUserDao = {
  async create(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: PortalRole;
    church: string;
    chapter: string | null;
  }) {
    return await PortalUserModel.create(data);
  },
  async findById(id: string) {
    return await PortalUserModel.findById(id).exec();
  },
  async findByIdWithPassword(id: string) {
    return await PortalUserModel.findById(id).select("+password").exec();
  },
  async findByEmail(email: string) {
    return await PortalUserModel.findOne({ email: email.trim().toLowerCase() }).exec();
  },
  async findByEmailWithPassword(email: string) {
    return await PortalUserModel.findOne({ email: email.trim().toLowerCase() })
      .select("+password")
      .exec();
  },
  /** The current counsellor of a church, if any. */
  async findActiveCounsellor(churchId: string) {
    return await PortalUserModel.findOne({
      church: churchId,
      role: "counsellor",
      isActive: true,
    }).exec();
  },
  /** The current president or secretary of a chapter, if any. */
  async findActiveChapterOfficer(chapterId: string, role: PortalRole) {
    return await PortalUserModel.findOne({
      chapter: chapterId,
      role,
      isActive: true,
    }).exec();
  },
  /** Active president/secretary accounts for the given chapters. */
  async findActiveOfficersForChapters(chapterIds: string[]) {
    return await PortalUserModel.find({
      chapter: { $in: chapterIds },
      role: { $in: ["president", "secretary"] },
      isActive: true,
    })
      .sort({ role: 1 })
      .exec();
  },
  /**
   * Active accounts that look after the given chapters: their presidents and
   * secretaries plus the counsellor of each chapter's church.
   */
  async findActiveIdsForChapters(chapterIds: string[], churchIds: string[]) {
    const docs = await PortalUserModel.find({
      isActive: true,
      $or: [
        { chapter: { $in: chapterIds } },
        { role: "counsellor", church: { $in: churchIds } },
      ],
    })
      .select("_id")
      .lean()
      .exec();
    return docs.map((d) => String(d._id));
  },
  /** Removes access for every portal account in a church (used when the church is deleted). */
  async deactivateByChurch(churchId: string) {
    return await PortalUserModel.updateMany({ church: churchId }, { isActive: false }).exec();
  },
  async update(id: string, data: Record<string, unknown>) {
    return await PortalUserModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).exec();
  },
};

export default PortalUserDao;
