import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, default: "" },
    image: { type: String, default: null },
    author: { type: String, default: null },
    read_time: { type: Number, default: 3 },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true },
);

const NewsModel = mongoose.model("News", newsSchema);
export default NewsModel;
