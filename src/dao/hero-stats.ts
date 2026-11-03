import HeroStatsModel from "@/models/hero-stats";

type HeroStatItem = {
  label: string;
  end: number;
  suffix?: string;
};

const HeroStatsDao = {
  async getSingleton() {
    return await HeroStatsModel.findOne().exec();
  },
  async upsertStats(stats: HeroStatItem[]) {
    return await HeroStatsModel.findOneAndUpdate(
      {},
      { stats },
      { returnDocument: "after", upsert: true },
    ).exec();
  },
};

export default HeroStatsDao;
