import RankDao from "@/dao/rank";
import { RankTypes } from "@/types/_types";

/**
 * Rank service.
 *
 * Besides basic CRUD, this keeps the rank ladder tidy: `order` values are
 * always 1, 2, 3 … n with no gaps or duplicates. Every change that affects
 * positions (create, move, delete, reorder) ends by rewriting the full
 * sequence, which is cheap because there are only a handful of ranks.
 */

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

/**
 * Current ladder as a list of rank ids, lowest rank first.
 * Ranks without an order yet (created before ordering existed) go last.
 */
async function getLadderIds(): Promise<string[]> {
  const ranks = await RankDao.findAllForOrdering();
  const ordered = ranks.filter((r) => r.order != null);
  const unordered = ranks.filter((r) => r.order == null);
  return [...ordered, ...unordered].map((r) => String(r._id));
}

/**
 * Moves one rank to a new position (1-based) and renumbers the ladder.
 * Algorithm: take the rank out of the list, insert it at the target index,
 * then write 1..n back. Out-of-range positions are clamped to the ends.
 */
async function moveRank(id: string, position: number) {
  const ids = (await getLadderIds()).filter((rankId) => rankId !== id);
  const index = Math.min(Math.max(position - 1, 0), ids.length);
  ids.splice(index, 0, id);
  await RankDao.writeOrder(ids);
}

/** Renumbers the ladder 1..n, closing any gaps (e.g. after a delete). */
async function normalizeLadder() {
  await RankDao.writeOrder(await getLadderIds());
}

const RankService = {
  /** New ranks go to the end of the ladder unless a position is given. */
  async createRank(rank: RankTypes) {
    const { order, ...fields } = rank;
    const created = await RankDao.createRank({
      ...fields,
      order: (await RankDao.findMaxOrder()) + 1,
    });
    if (order != null) await moveRank(String(created._id), order);
    return await RankDao.findById(String(created._id));
  },

  /** Bulk-created ranks are appended in the order they were sent. */
  async createRankBulk(ranks: RankTypes[]) {
    let next = (await RankDao.findMaxOrder()) + 1;
    const withOrder = ranks.map(({ order: _ignored, ...fields }) => ({
      ...fields,
      order: next++,
    }));
    return await RankDao.createRankBulk(withOrder);
  },

  async getAllRanks() {
    return await RankDao.findAll();
  },
  async getPublicRanks() {
    return await RankDao.findPublic();
  },
  async getRankById(id: string) {
    return await RankDao.findById(id);
  },

  /** Updates fields; if `order` is sent, the rank is moved to that position. */
  async updateRank(id: string, rank: Partial<RankTypes>) {
    const existing = await RankDao.findById(id);
    if (!existing) throw httpError(404, "Rank not found");

    const { order, ...fields } = rank;
    if (Object.keys(fields).length > 0) await RankDao.updateRank(id, fields);
    if (order != null) await moveRank(id, order);
    return await RankDao.findById(id);
  },

  /**
   * Saves a whole new ladder at once (used by drag/move in the portal).
   * `ids` must contain every rank exactly once, lowest rank first.
   */
  async reorderRanks(ids: string[]) {
    const current = await getLadderIds();
    const sent = new Set(ids);
    const isCompleteList =
      sent.size === ids.length &&
      ids.length === current.length &&
      current.every((id) => sent.has(id));
    if (!isCompleteList) {
      throw httpError(
        400,
        "The list must include every rank exactly once. Refresh and try again.",
      );
    }
    await RankDao.writeOrder(ids);
    return await RankDao.findAll();
  },

  async deleteRank(id: string) {
    const existing = await RankDao.findById(id);
    if (!existing) throw httpError(404, "Rank not found");
    const deleted = await RankDao.deleteRank(id);
    await normalizeLadder();
    return deleted;
  },
  async deleteRanks(ids: string[]) {
    const result = await RankDao.deleteMany(ids);
    await normalizeLadder();
    return result;
  },
};

export default RankService;
