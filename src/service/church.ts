import AccountDao from "@/dao/account";
import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import ChurchDao from "@/dao/church";
import PortalUserDao from "@/dao/portal-user";
import { httpError } from "@/helpers/http-error";
import ChapterService from "@/service/chapter";
import { ChurchTypes } from "@/types/_types";

/**
 * Church service.
 *
 * Chapter rules applied here:
 * - Every new church gets its default chapter straight away.
 * - Renaming the church's chapter name renames its default chapter.
 * - A church that has members can't be deleted (their records would be lost).
 */

async function getChurchOrThrow(id: string) {
  const church = await ChurchDao.findById(id);
  if (!church) throw httpError(404, "Church not found");
  return church;
}

/** Deletes a church and its chapters and logins — only if it has no members. */
async function deleteChurchSafely(id: string) {
  const church = await getChurchOrThrow(id);
  if ((await AmbassadorDao.countByChurch(id)) > 0) {
    throw httpError(
      409,
      `${church.name} has members, so it can't be deleted. Set it to inactive instead.`,
    );
  }
  await ChapterDao.deleteByChurch(id);
  await PortalUserDao.deactivateByChurch(id);
  await AmbassadorDao.deactivateCounsellorsOfChurch(id, "Church removed");
  return await ChurchDao.deleteChurch(id);
}

const ChurchService = {
  /**
   * Current counsellors of active churches, for the public site.
   * Only name, photo and church — never contact details.
   */
  async getPublicCounsellors() {
    const accounts = await AccountDao.listActiveCounsellors();
    return accounts
      .map((a) => {
        const church = a.chapterAccess?.church as unknown as
          | { _id?: unknown; name?: string; status?: string; image?: string | null }
          | null;
        const member = a.member as unknown as { photo?: string | null } | null;
        if (!church?._id || church.status !== "active") return null;
        return {
          id: String(a._id),
          name: a.name,
          photo: member?.photo ?? null,
          church: { id: String(church._id), name: church.name ?? "" },
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((x, y) => x.church.name.localeCompare(y.church.name));
  },
  async createChurch(church: ChurchTypes) {
    const created = await ChurchDao.addChurch(church);
    await ChapterService.ensureDefaultChapter(created);
    return created;
  },
  async createBulkChurch(church: ChurchTypes) {
    const created = await ChurchDao.addManyChurch(church);
    for (const item of created) {
      await ChapterService.ensureDefaultChapter(item);
    }
    return created;
  },
  async getAllChurch() {
    return await ChurchDao.getAllChurch();
  },
  async getPublicChurches() {
    return await ChurchDao.getPublicChurches();
  },
  async getChurchById(id: string) {
    return await ChurchDao.findById(id);
  },
  async updateChurch(id: string, church: Partial<ChurchTypes>) {
    await getChurchOrThrow(id);
    const updated = await ChurchDao.updateChurch(id, church);
    if (church.chapter?.trim()) {
      await ChapterService.syncDefaultChapterName(id, church.chapter.trim());
    }
    return updated;
  },
  async deleteChurch(id: string) {
    return await deleteChurchSafely(id);
  },
  /** Deletes one by one so a church with members stops the batch with a clear message. */
  async deleteChurches(ids: string[]) {
    for (const id of ids) {
      await deleteChurchSafely(id);
    }
  },
};

export default ChurchService;
