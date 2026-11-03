import mongoose from "mongoose";

/**
 * Chapter — a group of ambassadors inside a church.
 *
 * Every church has one default chapter (created with the church).
 * Extra chapters are requested by the church counsellor and approved by a
 * super_admin, so a chapter can be `pending` or `rejected` before it is `active`.
 */
export const CHAPTER_STATUSES = ["pending", "active", "rejected"] as const;

const chapterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    church: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: CHAPTER_STATUSES,
      default: "active",
    },
    /** The church's first chapter. It is renamed with the church and can't be removed. */
    isDefault: { type: Boolean, default: false },

    // ── New-chapter request fields (empty for the default chapter) ──
    /** The counsellor who asked for this chapter. */
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", default: null },
    /** Members to move into this chapter once it is approved. */
    requestedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ambassador" }],
    /** Rejection reason from the reviewer. */
    reviewNote: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

chapterSchema.index({ church: 1, name: 1 }, { unique: true });
chapterSchema.index({ church: 1, status: 1 });

const ChapterModel = mongoose.model("Chapter", chapterSchema);

export default ChapterModel;
