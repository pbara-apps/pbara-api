import MessageDao from "@/dao/message";
import AuditLogDao from "@/dao/audit-log";
import ChurchDao from "@/dao/church";
import EventDao from "@/dao/event";
import ExecutiveDao from "@/dao/executive";
import HeroStatsDao from "@/dao/hero-stats";
import GalleryDao from "@/dao/gallery";
import NewsDao from "@/dao/news";
import OfficeDao from "@/dao/offices";
import { OfficeTypes } from "@/types/_types";

type ActivityItem = {
  id: string;
  kind: string;
  action: string;
  title: string;
  subtitle?: string;
  timestamp: string;
};

type DirectorDeskUpdatePayload = {
  title?: string;
  description?: string;
  image?: string | null;
};

type HeroStatItem = {
  label: string;
  end: number;
  suffix?: string;
};

const DEFAULT_HERO_STATS: Required<HeroStatItem>[] = [
  { end: 21, label: "Active Chapters", suffix: "+" },
  { end: 500, label: "Total Ambassadors", suffix: "+" },
  { end: 14, label: "Years of Impact", suffix: "+" },
];

const AdminService = {
  async getDashboard() {
    const [
      totalChapters,
      activeChapters,
      totalOffices,
      totalExecutives,
      activeExecutives,
      totalNews,
      publishedNews,
      totalEvents,
      upcomingEvents,
      totalGallery,
      activeGallery,
      recentLogs,
      totalMessagesCount,
      unreadMessages,
    ] = await Promise.all([
      ChurchDao.countAll(),
      ChurchDao.countActive(),
      OfficeDao.countAll(),
      ExecutiveDao.countAll(),
      ExecutiveDao.countActive(),
      NewsDao.countAll(),
      NewsDao.countPublished(),
      EventDao.countAll(),
      EventDao.countUpcoming(),
      GalleryDao.countAll(),
      GalleryDao.countActive(),
      AuditLogDao.findAll(8),
      MessageDao.countAll(),
      MessageDao.countUnread(),
    ]);

    const recentActivity: ActivityItem[] = recentLogs.map((log) => ({
      id: String(log._id),
      kind: log.entity_type,
      action: log.action,
      title: log.entity_title,
      subtitle: log.actor_name ?? undefined,
      timestamp:
        (log as { createdAt?: Date }).createdAt?.toISOString() ?? "",
    }));

    return {
      totalChapters,
      activeChapters,
      totalOffices,
      totalExecutives,
      activeExecutives,
      totalNews,
      publishedNews,
      totalEvents,
      upcomingEvents,
      totalGallery,
      activeGallery,
      totalMessages: totalMessagesCount,
      unreadMessages,
      recentActivity,
    };
  },
  async getDirectorDesk() {
    try {
      const officeId = (await OfficeDao.findByName("Director")) as OfficeTypes;
      const directorDesk = await ExecutiveDao.getDirectorDesk(
        officeId?._id ?? "",
      );
      if (!directorDesk) return null;
      return {
        _id: directorDesk._id,
        name: directorDesk.name,
        title: directorDesk.title,
        description: directorDesk.description,
        image: directorDesk.image ?? null,
      };
    } catch (error) {
      throw error;
    }
  },
  async updateDirectorDesk(payload: DirectorDeskUpdatePayload) {
    const officeId = (await OfficeDao.findByName("Director")) as OfficeTypes;
    const directorDesk = await ExecutiveDao.getDirectorDesk(officeId?._id ?? "");

    if (!directorDesk?._id) {
      const err = new Error("Active director profile not found") as Error & {
        status?: number;
      };
      err.status = 404;
      throw err;
    }

    const updatePayload = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      ...(payload.image !== undefined
        ? { image: payload.image ?? "" }
        : {}),
    };

    return await ExecutiveDao.updateExecutive(
      String(directorDesk._id),
      updatePayload,
    );
  },
  async getHeroStats() {
    const settings = await HeroStatsDao.getSingleton();
    const stats = settings?.stats ?? DEFAULT_HERO_STATS;
    return stats.map((item) => ({
      label: String(item.label ?? "").trim(),
      end: Number(item.end ?? 0),
      suffix: String(item.suffix ?? "+").trim() || "+",
    }));
  },
  async updateHeroStats(payload: { stats: HeroStatItem[] }) {
    const normalized = payload.stats.map((item) => ({
      label: item.label.trim(),
      end: Number(item.end),
      suffix: item.suffix?.trim() || "+",
    }));
    const updated = await HeroStatsDao.upsertStats(normalized);
    return (
      updated?.stats?.map((item) => ({
        label: String(item.label ?? "").trim(),
        end: Number(item.end ?? 0),
        suffix: String(item.suffix ?? "+").trim() || "+",
      })) ?? DEFAULT_HERO_STATS
    );
  },
};

export default AdminService;
