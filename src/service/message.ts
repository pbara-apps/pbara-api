import MessageDao from "@/dao/message";

type CreateMessageInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

const MessageService = {
  async create(data: CreateMessageInput) {
    return await MessageDao.create(data);
  },
  async getAll() {
    return await MessageDao.findAll();
  },
  async getUnreadCount() {
    return await MessageDao.countUnread();
  },
  async markRead(id: string, readBy?: string) {
    const message = await MessageDao.findById(id);
    if (!message) {
      throw new Error("Message not found");
    }
    if (message.is_read) return message;
    return await MessageDao.markRead(id, readBy);
  },
  async markManyRead(ids: string[], readBy?: string) {
    await MessageDao.markManyRead(ids, readBy);
    return { updatedCount: ids.length };
  },
  async delete(id: string) {
    const message = await MessageDao.findById(id);
    if (!message) {
      throw new Error("Message not found");
    }
    await MessageDao.delete(id);
  },
  async deleteMany(ids: string[]) {
    await MessageDao.deleteMany(ids);
    return { deletedCount: ids.length };
  },
};

export default MessageService;
