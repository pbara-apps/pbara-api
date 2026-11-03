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
    rank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rank",
      required: true,
    },
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
