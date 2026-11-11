import RegistrationModel from "@/models/registration";
import { RegistrationTypes } from "@/types/_types";
import mongoose, { type ClientSession } from "mongoose";

type RegistrationPayload = Partial<RegistrationTypes> & {
  status?: "pending" | "verified" | "rejected";
  adminNote?: string | null;
};

export type RegistrationListFilters = {
  programId?: string;
  programIds?: mongoose.Types.ObjectId[];
  status?: "pending" | "verified" | "rejected";
  page: number;
  limit: number;
};

const RegistrationDao = {
  async create(data: RegistrationPayload) {
    const created = await RegistrationModel.create(data);
    return await RegistrationDao.findById(String(created._id));
  },
  async findById(id: string) {
    return await RegistrationModel.findById(id)
      .populate("programId")
      .populate("entries.rank", "name category")
      .populate("entries.church", "name chapter")
      .exec();
  },
  async findFiltered(filters: RegistrationListFilters) {
    const query: Record<string, unknown> = {};

    if (filters.programId) {
      query.programId = filters.programId;
    } else if (filters.programIds) {
      query.programId = { $in: filters.programIds };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;
    const [items, total] = await Promise.all([
      RegistrationModel.find(query)
        .populate("programId", "title slug category amount isActive")
        .populate("entries.rank", "name category")
        .populate("entries.church", "name chapter")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .exec(),
      RegistrationModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  },
  async updateStatus(
    id: string,
    data: { status: "verified" | "rejected"; adminNote?: string | null },
  ) {
    return await RegistrationModel.findByIdAndUpdate(id, data, { returnDocument: "after" })
      .populate("programId", "title slug category amount isActive")
      .populate("entries.rank", "name category")
      .populate("entries.church", "name chapter")
      .exec();
  },
  async addEntries(
    id: string,
    data: {
      entries: Array<{
        name: string;
        rank: string;
        church: string;
        registrationCode: string;
      }>;
      registrationType?: "single" | "bulk";
    },
  ) {
    const update: Record<string, unknown> = {
      $push: { entries: { $each: data.entries } },
    };
    if (data.registrationType) {
      update.$set = { registrationType: data.registrationType };
    }

    await RegistrationModel.findByIdAndUpdate(id, update).exec();
    return await RegistrationDao.findById(id);
  },
  async updateEntryByCode(
    id: string,
    code: string,
    data: { name?: string; rank?: string; church?: string },
  ) {
    const setFields: Record<string, string> = {};
    if (data.name !== undefined) setFields["entries.$.name"] = data.name;
    if (data.rank !== undefined) setFields["entries.$.rank"] = data.rank;
    if (data.church !== undefined) setFields["entries.$.church"] = data.church;

    await RegistrationModel.findOneAndUpdate(
      { _id: id, "entries.registrationCode": code },
      { $set: setFields },
    ).exec();

    return await RegistrationDao.findById(id);
  },
  /** Member ids already registered (not rejected) for a program, out of `ambassadorIds`. */
  async findRegisteredAmbassadorIds(programId: string, ambassadorIds: string[]) {
    const regs = await RegistrationModel.find({
      programId,
      status: { $ne: "rejected" },
      "entries.ambassador": { $in: ambassadorIds },
    })
      .select("entries.ambassador")
      .lean()
      .exec();
    const wanted = new Set(ambassadorIds);
    return new Set(
      regs.flatMap((r) => r.entries.map((e) => String(e.ambassador))).filter((id) => wanted.has(id)),
    );
  },
  /** Registrations that include members from the given chapters, newest first. */
  async findForChapters(chapterIds: string[]) {
    return await RegistrationModel.find({ "entries.chapter": { $in: chapterIds } })
      .populate("programId", "title slug category amount")
      .populate("entries.rank", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
  },
  /** Entries for these members, with program title (to describe them in notifications). */
  async findEntriesForAmbassadors(ambassadorIds: string[]) {
    return await RegistrationModel.find({ "entries.ambassador": { $in: ambassadorIds } })
      .populate("programId", "title")
      .lean()
      .exec();
  },
  /** Sets the membership flag on every entry for these members. */
  async setMembershipForAmbassadors(
    ambassadorIds: string[],
    membership: "member" | "pending" | "non_member",
    session?: ClientSession,
  ) {
    return await RegistrationModel.updateMany(
      { "entries.ambassador": { $in: ambassadorIds } },
      { $set: { "entries.$[entry].membership": membership } },
      { arrayFilters: [{ "entry.ambassador": { $in: ambassadorIds } }], session },
    ).exec();
  },
  async countPending() {
    return await RegistrationModel.countDocuments({ status: "pending" }).exec();
  },
};

export default RegistrationDao;
