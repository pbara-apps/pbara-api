import mongoose from "mongoose";

const directorDeskSchema = new mongoose.Schema({
  executive_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Executive",
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "Director's Desk",
  },
  description: {
    type: String,
    required: true,
  },
  current: {
    type: Boolean,
    default: false,
  },
});

const DirectorDeskModel = mongoose.model("DirectorDesk", directorDeskSchema);

export default DirectorDeskModel;
