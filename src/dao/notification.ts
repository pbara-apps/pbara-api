import NotificationModel, { type RecipientType } from "@/models/notification";

/**
 * Who is reading. `aliases` are older ids of the same person (accounts that
 * were merged), so notifications sent to an old id still show up.
 */
export type Recipient = { type: RecipientType; id: string; aliases?: string[] };

const owner = (r: Recipient) => ({
  recipientType: r.type,
  recipient: r.aliases?.length ? { $in: [r.id, ...r.aliases] } : r.id,
});

/** Database queries for in-app notifications. */
const NotificationDao = {
  async createMany(docs: Record<string, unknown>[]) {
    if (docs.length === 0) return [];
    return await NotificationModel.insertMany(docs);
  },
  async listFor(recipient: Recipient, limit: number) {
    return await NotificationModel.find(owner(recipient))
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  },
  async countUnread(recipient: Recipient) {
    return await NotificationModel.countDocuments({ ...owner(recipient), readAt: null }).exec();
  },
  /** Marks one notification read — only if it belongs to this recipient. */
  async markRead(recipient: Recipient, id: string) {
    return await NotificationModel.updateOne(
      { ...owner(recipient), _id: id, readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
  },
  async markAllRead(recipient: Recipient) {
    return await NotificationModel.updateMany(
      { ...owner(recipient), readAt: null },
      { $set: { readAt: new Date() } },
    ).exec();
  },
};

export default NotificationDao;
