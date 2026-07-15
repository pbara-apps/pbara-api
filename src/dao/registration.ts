import RegistrationModel from "@/models/registration";
import { RegistrationTypes } from "@/types/_types";
import mongoose from "mongoose";

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
    return await RegistrationModel.findByIdAndUpdate(id, data, { new: true })
      .populate("programId", "title slug category amount isActive")
      .populate("entries.rank", "name category")
      .populate("entries.church", "name chapter")
      .exec();
  },
  async countPending() {
    return await RegistrationModel.countDocuments({ status: "pending" }).exec();
  },
};

export default RegistrationDao;
