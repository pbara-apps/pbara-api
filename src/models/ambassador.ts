import mongoose from "mongoose";

/**
 * Ambassador — one member of the association.
 *
 * Lifecycle:
 * - Added by a chapter officer → `pending` (no member ID yet, not counted).
 * - super_admin approves → `active` and receives a permanent member ID.
 * - super_admin rejects → `rejected` (reason kept in `reviewNote`).
 * - super_admin asks for changes → stays `pending` with `changesRequested: true`
 *   until the chapter edits and resubmits.
 * - `transferred` / `inactive` are used later for moves and members who leave.
 *
 * Only `active` members count in chapter and association totals.
 */
export const AMBASSADOR_STATUSES = [
  "pending",
  "active",
  "rejected",
  "transferred",
  "inactive",
] as const;
export type AmbassadorStatus = (typeof AMBASSADOR_STATUSES)[number];

/**
 * One rank the member has reached. Date and proof are optional.
 * The list is kept in ladder order; the last entry is the current rank.
 */
const rankProgressSchema = new mongoose.Schema(
  {
    rank: { type: mongoose.Schema.Types.ObjectId, ref: "Rank", required: true },
    dateReached: { type: Date, default: null },
    proofUrl: { type: String, default: null },
  },
  { _id: false },
);

/** A completed move between chapters, kept so a member's history stays complete. */
const chapterMoveSchema = new mongoose.Schema(
  {
    fromChapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    toChapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    movedAt: { type: Date, required: true },
  },
  { _id: false },
);

const ambassadorSchema = new mongoose.Schema(
  {
    /** e.g. PBARA-000123. Given on approval; null while pending. */
    memberId: { type: String, default: null },
    fullName: { type: String, required: true, trim: true },
    /** Lower-case name with single spaces, used for the duplicate check. */
    nameKey: { type: String, required: true },
    dateOfBirth: { type: Date, default: null },
    /** Optional. The portal shows the association logo when empty. */
    photo: { type: String, default: null },
    phone: { type: String, default: null, trim: true },
    guardianName: { type: String, default: null, trim: true },
    guardianPhone: { type: String, default: null, trim: true },
    /** Current rank — always the highest rank in `rankHistory`. */
    rank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rank",
      required: true,
    },
    rankHistory: { type: [rankProgressSchema], default: [] },
    /** Every chapter move (transfers and new-chapter moves). */
    chapterHistory: { type: [chapterMoveSchema], default: [] },
    church: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: AMBASSADOR_STATUSES,
      default: "pending",
    },
    changesRequested: { type: Boolean, default: false },
    /** Why a member was set to inactive (e.g. "Left the church", "Relocated"). */
    statusReason: { type: String, default: null },
    /** Rejection reason or "changes needed" note from the reviewer. */
    reviewNote: { type: String, default: null },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortalUser",
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Executive",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Unique only among members that have an ID. (A "sparse" index would still
// treat every pending member's null ID as a duplicate.)
ambassadorSchema.index(
  { memberId: 1 },
  { unique: true, partialFilterExpression: { memberId: { $type: "string" } } },
);
ambassadorSchema.index({ chapter: 1, status: 1 });
ambassadorSchema.index({ church: 1, status: 1 });
ambassadorSchema.index({ nameKey: 1, dateOfBirth: 1 });
ambassadorSchema.index({ status: 1, createdAt: -1 });

const AmbassadorModel = mongoose.model("Ambassador", ambassadorSchema);

export default AmbassadorModel;
