import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import RankDao from "@/dao/rank";

/** How many months of growth the overview chart shows. */
const MONTHS_OF_GROWTH = 12;

/**
 * Association membership numbers for the admin dashboard: totals, work
 * waiting for review, members per rank, and new members per month.
 */
const MembershipOverviewService = {
  async get() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (MONTHS_OF_GROWTH - 1));

    const [activeMembers, pendingApprovals, activeChapters, pendingChapterRequests, ranks, rankCounts, approvals] =
      await Promise.all([
        AmbassadorDao.countByStatus({ statuses: ["active"] }),
        AmbassadorDao.countByStatus({ statuses: ["pending"] }),
        ChapterDao.countByStatus("active"),
        ChapterDao.countByStatus("pending"),
        RankDao.findAll(),
        AmbassadorDao.countAllActiveByRank(),
        AmbassadorDao.countApprovedByMonth(start),
      ]);

    const countByRank = new Map(rankCounts.map((r) => [String(r._id), r.count]));
    const byRank = ranks.map((r) => ({ name: r.name, count: countByRank.get(String(r._id)) ?? 0 }));

    // One entry per month (oldest first), filling months with no approvals with 0.
    const approvalsByKey = new Map(approvals.map((a) => [`${a._id.year}-${a._id.month}`, a.count]));
    const growth = Array.from({ length: MONTHS_OF_GROWTH }, (_, i) => {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      return { year, month, newMembers: approvalsByKey.get(`${year}-${month}`) ?? 0 };
    });

    return { activeMembers, pendingApprovals, activeChapters, pendingChapterRequests, byRank, growth };
  },
};

export default MembershipOverviewService;
