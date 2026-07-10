import mongoose from "mongoose";

const rankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const RankModel = mongoose.model("Rank", rankSchema);

export default RankModel;
