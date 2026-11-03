import { asyncHandler } from "@/helpers/async-handler";
import { getActor } from "@/helpers/request-actor";
import AchievementService from "@/service/achievement";
import ChapterRequestService from "@/service/chapter-request";
import PortalAccountService from "@/service/portal-account";
import RecruitmentService from "@/service/recruitment";

/** Association side: church counsellor logins and the Recruitment Board. */
const ChapterAdminController = {
  // Church counsellor
  getCounsellor: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.getCounsellor(req.params.id as string);
    res.status(200).json({ message: "Counsellor fetched successfully", data });
  }),

  assignCounsellor: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.assignCounsellor(
      req.params.id as string,
      req.body,
      getActor(req),
    );
    res.status(200).json({ message: "Counsellor saved successfully", data });
  }),

  resendCounsellorPassword: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.resendCounsellorPassword(
      req.params.id as string,
      getActor(req),
    );
    res.status(200).json({ message: "One-time password reset", data });
  }),

  // Chapters and new-chapter requests
  listChapters: asyncHandler(async (req, res) => {
    const data = await ChapterRequestService.listActiveChapters(req.query.churchId as string | undefined);
    res.status(200).json({ message: "Chapters fetched successfully", data });
  }),

  listChapterRequests: asyncHandler(async (req, res) => {
    const data = await ChapterRequestService.listRequests(
      (req.query.status as "pending" | "rejected" | undefined) ?? "pending",
    );
    res.status(200).json({ message: "Chapter requests fetched successfully", data });
  }),

  approveChapterRequest: asyncHandler(async (req, res) => {
    const data = await ChapterRequestService.approve(req.params.id as string, getActor(req));
    res.status(200).json({ message: `Chapter approved; ${data.moved} members moved`, data });
  }),

  rejectChapterRequest: asyncHandler(async (req, res) => {
    await ChapterRequestService.reject(req.params.id as string, req.body.note, getActor(req));
    res.status(200).json({ message: "Chapter request rejected", data: null });
  }),

  // Achievements (read only)
  listAchievements: asyncHandler(async (req, res) => {
    const data = await AchievementService.listAll({
      churchId: req.query.churchId as string | undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    res.status(200).json({ message: "Achievements fetched successfully", data });
  }),

  // Recruitment Board
  listRequests: asyncHandler(async (req, res) => {
    const data = await RecruitmentService.listRequests({
      status: req.query.status as "pending" | "rejected" | undefined,
      search: req.query.search as string | undefined,
      churchId: req.query.churchId as string | undefined,
    });
    res.status(200).json({ message: "Requests fetched successfully", data });
  }),

  pendingCount: asyncHandler(async (_req, res) => {
    const data = await RecruitmentService.countPending();
    res.status(200).json({ message: "Pending count fetched", data });
  }),

  approve: asyncHandler(async (req, res) => {
    const data = await RecruitmentService.approve(req.body.ids, getActor(req));
    res.status(200).json({ message: `${data.approved} member(s) approved`, data });
  }),

  reject: asyncHandler(async (req, res) => {
    const data = await RecruitmentService.reject(req.body.ids, req.body.note, getActor(req));
    res.status(200).json({ message: `${data.updated} member(s) rejected`, data });
  }),

  requestChanges: asyncHandler(async (req, res) => {
    const data = await RecruitmentService.requestChanges(
      req.body.ids,
      req.body.note,
      getActor(req),
    );
    res.status(200).json({ message: `Changes requested for ${data.updated} member(s)`, data });
  }),
};

export default ChapterAdminController;
