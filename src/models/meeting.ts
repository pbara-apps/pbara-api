import mongoose from "mongoose";

/**
 * Meeting — one chapter meeting or activity: who attended plus a short
 * report. Used for attendance rates and the association's activity view.
 */
const meetingSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", required: true },
    church: { type: mongoose.Schema.Types.ObjectId, ref: "Church", required: true },
    date: { type: Date, required: true },
    activity: { type: String, required: true, trim: true },
    report: { type: String, default: null, trim: true },
    present: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ambassador" }],
    /** Members of the chapter at the time (to work out the attendance rate). */
    memberCount: { type: Number, required: true, min: 0 },
    visitors: { type: Number, default: 0, min: 0 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  },
  { timestamps: true },
);

meetingSchema.index({ chapter: 1, date: -1 });
meetingSchema.index({ church: 1, date: -1 });
meetingSchema.index({ present: 1 });

const MeetingModel = mongoose.model("Meeting", meetingSchema);
export default MeetingModel;
