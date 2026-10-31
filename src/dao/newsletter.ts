import NewsletterModel from "@/models/newsletter";

type NewsletterPayload = {
  subject?: string;
  content?: string;
  status?: "sending" | "sent" | "partial" | "failed";
  recipient_count?: number;
  sent_count?: number;
  failed_count?: number;
  sent_by?: string | null;
  sent_by_name?: string | null;
};

const NewsletterDao = {
  async create(data: NewsletterPayload) {
    return await NewsletterModel.create(data);
  },
  async update(id: string, data: NewsletterPayload) {
    return await NewsletterModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async findRecent(limit = 20) {
    return await NewsletterModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  },
};

export default NewsletterDao;
