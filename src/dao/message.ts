import MessageModel from "@/models/message";

type MessagePayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  subject?: string;
  message?: string;
  is_read?: boolean;
  read_at?: Date | null;
  read_by?: string | null;
};

const MessageDao = {
  async create(data: MessagePayload) {
    return await MessageModel.create(data);
  },
  async findAll() {
    return await MessageModel.find().sort({ createdAt: -1 }).exec();
  },
  async findById(id: string) {
    return await MessageModel.findById(id).exec();
  },
  async markRead(id: string, readBy?: string) {
    return await MessageModel.findByIdAndUpdate(
      id,
      {
        is_read: true,
        read_at: new Date(),
        read_by: readBy ?? null,
      },
      { new: true },
    ).exec();
  },
  async markManyRead(ids: string[], readBy?: string) {
    return await MessageModel.updateMany(
      { _id: { $in: ids } },
      {
        is_read: true,
        read_at: new Date(),
        read_by: readBy ?? null,
      },
    ).exec();
  },
  async delete(id: string) {
    return await MessageModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await MessageModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countUnread() {
    return await MessageModel.countDocuments({ is_read: false }).exec();
  },
  async countAll() {
    return await MessageModel.countDocuments().exec();
  },
};

export default MessageDao;
