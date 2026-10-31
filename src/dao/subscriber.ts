import SubscriberModel, { newUnsubscribeToken } from "@/models/subscriber";

const SubscriberDao = {
  async findByEmail(email: string) {
    return await SubscriberModel.findOne({ email }).exec();
  },
  // Upsert so repeat sign-ups (or re-subscribes) don't error.
  async subscribe(email: string, source?: string | null) {
    return await SubscriberModel.findOneAndUpdate(
      { email },
      {
        $set: { is_active: true, unsubscribed_at: null },
        $setOnInsert: {
          email,
          source: source ?? null,
          unsubscribe_token: newUnsubscribeToken(),
        },
      },
      { new: true, upsert: true },
    ).exec();
  },
  async unsubscribeByToken(token: string) {
    return await SubscriberModel.findOneAndUpdate(
      { unsubscribe_token: token },
      { $set: { is_active: false, unsubscribed_at: new Date() } },
      { new: true },
    ).exec();
  },
  /** Active subscribers' email + token. Backfills tokens on older records. */
  async findActiveRecipients() {
    const docs = await SubscriberModel.find({ is_active: true })
      .select("email unsubscribe_token")
      .lean()
      .exec();
    const recipients: { email: string; token: string }[] = [];
    for (const doc of docs) {
      let token = doc.unsubscribe_token as string | undefined;
      if (!token) {
        token = newUnsubscribeToken();
        await SubscriberModel.updateOne(
          { _id: doc._id },
          { $set: { unsubscribe_token: token } },
        ).exec();
      }
      recipients.push({ email: doc.email, token });
    }
    return recipients;
  },
  async findAll() {
    return await SubscriberModel.find()
      .select("-unsubscribe_token")
      .sort({ createdAt: -1 })
      .exec();
  },
  async findById(id: string) {
    return await SubscriberModel.findById(id).exec();
  },
  async delete(id: string) {
    return await SubscriberModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await SubscriberModel.deleteMany({ _id: { $in: ids } }).exec();
  },
};

export default SubscriberDao;
