import mongoose from "mongoose";

/**
 * Announcement — a circular from the association to chapter portal users.
 * Audience: everyone, or only the selected churches (all their officers).
 * `reads` records who has opened it, so the association can see reach.
 */
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: { type: String, required: true, enum: ["all", "selected"] },
    targetChurches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Church" }],
    reads: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "PortalUser", required: true },
        readAt: { type: Date, required: true },
        _id: false,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Executive", default: null },
  },
  { timestamps: true },
);

announcementSchema.index({ createdAt: -1 });

const AnnouncementModel = mongoose.model("Announcement", announcementSchema);
export default AnnouncementModel;
