import mongoose from "mongoose";

/**
 * Achievement — something a chapter accomplished (e.g. "1st place, Bible
 * quiz"). Added by chapter officers and visible straight away; no approval.
 */
const achievementSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    church: { type: mongoose.Schema.Types.ObjectId, ref: "Church", required: true },
    name: { type: String, required: true, trim: true },
    /** Image or PDF showing the achievement (certificate, photo, letter). */
    proofUrl: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    description: { type: String, default: null, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", default: null },
  },
  { timestamps: true },
);

achievementSchema.index({ chapter: 1, year: -1, month: -1 });
achievementSchema.index({ church: 1, year: -1, month: -1 });

const AchievementModel = mongoose.model("Achievement", achievementSchema);

export default AchievementModel;
