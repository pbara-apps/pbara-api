import MessageDao from "@/dao/message";
import AuditLogDao from "@/dao/audit-log";
import ChurchDao from "@/dao/church";
import EventDao from "@/dao/event";
import ExecutiveDao from "@/dao/executive";
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

    return await ExecutiveDao.updateExecutive(String(directorDesk._id), payload);
  },
};

export default AdminService;
