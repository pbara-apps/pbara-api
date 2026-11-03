import mongoose from "mongoose";

/**
 * Census — a chapter's yearly confirmation of who is still active.
 * One per chapter per year. Members not confirmed are set inactive with
 * the reason given.
 */
const censusSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    church: { type: mongoose.Schema.Types.ObjectId, ref: "Church", required: true },
    year: { type: Number, required: true },
    confirmedCount: { type: Number, required: true, min: 0 },
    removed: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "Ambassador", required: true },
        reason: { type: String, required: true },
        _id: false,
      },
    ],
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", default: null },
  },
  { timestamps: true },
);

censusSchema.index({ chapter: 1, year: 1 }, { unique: true });
censusSchema.index({ year: 1 });

const CensusModel = mongoose.model("Census", censusSchema);
export default CensusModel;
