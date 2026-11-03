import mongoose from "mongoose";

/**
 * Rank — an official Royal Ambassador rank (e.g. Candidate, Intern, Envoy).
 *
 * `order` is the rank's position in the progression ladder:
 * 1 is the first (lowest) rank, higher numbers are more senior.
 * Every rank list in the system is sorted by it, and the member
 * rank-progress line uses it to draw ranks in sequence.
 *
 * `maxAge` is optional: the oldest age that is normal for this rank.
 * Members older than it get a soft warning (never blocked). Every rank
 * shares the same minimum joining age (MIN_JOIN_AGE).
 */
export const MIN_JOIN_AGE = 10;

const rankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      min: 1,
      default: null,
      index: true,
    },
    maxAge: {
      type: Number,
      min: 1,
      default: null,
    },
  },
  { timestamps: true },
);

const RankModel = mongoose.model("Rank", rankSchema);

export default RankModel;
