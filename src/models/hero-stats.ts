import mongoose from "mongoose";

const heroStatItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    end: {
      type: Number,
      required: true,
      min: 0,
    },
    suffix: {
      type: String,
      default: "+",
      trim: true,
    },
  },
  { _id: false },
);

const heroStatsSchema = new mongoose.Schema(
  {
    stats: {
      type: [heroStatItemSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length > 0 && value.length <= 4,
        message: "Hero stats must include between 1 and 4 items",
      },
    },
  },
  { timestamps: true },
);

const HeroStatsModel = mongoose.model("HeroStats", heroStatsSchema);

export default HeroStatsModel;
