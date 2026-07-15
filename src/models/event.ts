import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    endDate: { type: String, default: null },
    venue: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: ["open", "completed", "cancelled"],
      default: "open",
    },
    /** When set, public "Register Now" links to this program's registration page. */
    registrationProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistrationProgram",
      default: null,
    },
  },
  { timestamps: true },
);

const EventModel = mongoose.model("Event", eventSchema);
export default EventModel;
