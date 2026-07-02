import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    alt: { type: String, default: "" },
    url: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["photo", "video"],
      default: "photo",
    },
    category: { type: String, default: "General" },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const GalleryModel = mongoose.model("Gallery", gallerySchema);
export default GalleryModel;
