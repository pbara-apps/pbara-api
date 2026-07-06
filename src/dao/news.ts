import mongoose from "mongoose";
import NewsModel from "@/models/news";

type NewsPayload = {
  title?: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string | null;
  author?: string | null;
  read_time?: number;
  status?: "draft" | "published";
};

const NewsDao = {
  async create(data: NewsPayload) {
    return await NewsModel.create(data);
  },
  async findAll() {
    return await NewsModel.find().sort({ createdAt: -1 }).exec();
  },
  async findPublic() {
    return await NewsModel.find({ status: "published" })
      .sort({ createdAt: -1 })
      .exec();
  },
  async findPublicByIdOrSlug(idOrSlug: string) {
    const isObjectId =
      /^[a-f\d]{24}$/i.test(idOrSlug) &&
      String(new mongoose.Types.ObjectId(idOrSlug)) === idOrSlug;

    if (isObjectId) {
      const byId = await NewsModel.findOne({
        _id: idOrSlug,
        status: "published",
      }).exec();
      if (byId) return byId;
    }

    return await NewsModel.findOne({ slug: idOrSlug, status: "published" }).exec();
  },
  async findRelated(category: string, excludeId: string, limit = 4) {
    return await NewsModel.find({
      status: "published",
      category,
      _id: { $ne: excludeId },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },
  async findById(id: string) {
    return await NewsModel.findById(id).exec();
  },
  async findBySlug(slug: string) {
    return await NewsModel.findOne({ slug }).exec();
  },
  async update(id: string, data: NewsPayload) {
    return await NewsModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async delete(id: string) {
    return await NewsModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await NewsModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await NewsModel.countDocuments().exec();
  },
  async countPublished() {
    return await NewsModel.countDocuments({ status: "published" }).exec();
  },
};

export default NewsDao;
