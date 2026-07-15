import EventModel from "@/models/event";

type EventPayload = {
  title?: string;
  category?: string;
  date?: string;
  endDate?: string | null;
  venue?: string;
  description?: string;
  image?: string | null;
  status?: "open" | "completed" | "cancelled";
  registrationProgramId?: string | null;
};

const PROGRAM_POPULATE = {
  path: "registrationProgramId",
  select: "title slug isActive",
} as const;

const EventDao = {
  async create(data: EventPayload) {
    const created = await EventModel.create(data);
    return await EventModel.findById(created._id).populate(PROGRAM_POPULATE).exec();
  },
  async findAll() {
    return await EventModel.find()
      .populate(PROGRAM_POPULATE)
      .sort({ createdAt: -1 })
      .exec();
  },
  async findPublic() {
    return await EventModel.find({ status: "open" })
      .populate(PROGRAM_POPULATE)
      .sort({ createdAt: -1 })
      .exec();
  },
  async findById(id: string) {
    return await EventModel.findById(id).populate(PROGRAM_POPULATE).exec();
  },
  async update(id: string, data: EventPayload) {
    return await EventModel.findByIdAndUpdate(id, data, { new: true })
      .populate(PROGRAM_POPULATE)
      .exec();
  },
  async delete(id: string) {
    return await EventModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await EventModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await EventModel.countDocuments().exec();
  },
  async countUpcoming() {
    return await EventModel.countDocuments({
      status: "open",
    }).exec();
  },
};

export default EventDao;
