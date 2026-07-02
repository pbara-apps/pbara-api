import GalleryModel from "@/models/gallery";

type GalleryPayload = {
  title?: string;
  alt?: string;
  url?: string;
  type?: "photo" | "video";
  category?: string;
  status?: "active" | "inactive";
  sort_order?: number;
};

const GalleryDao = {
  async create(data: GalleryPayload) {
    return await GalleryModel.create(data);
  },
  async findAll() {
    return await GalleryModel.find().sort({ sort_order: 1, createdAt: -1 }).exec();
  },
  async findPublic(type?: "photo" | "video") {
    const filter: Record<string, unknown> = { status: "active" };
    if (type) filter.type = type;
    return await GalleryModel.find(filter)
      .sort({ sort_order: 1, createdAt: -1 })
      .exec();
  },
  async findById(id: string) {
    return await GalleryModel.findById(id).exec();
  },
  async update(id: string, data: GalleryPayload) {
    return await GalleryModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async delete(id: string) {
    return await GalleryModel.findByIdAndDelete(id).exec();
  },
  async deleteMany(ids: string[]) {
    return await GalleryModel.deleteMany({ _id: { $in: ids } }).exec();
  },
  async countAll() {
    return await GalleryModel.countDocuments().exec();
  },
  async countActive() {
    return await GalleryModel.countDocuments({ status: "active" }).exec();
  },
};

export default GalleryDao;
