import { asyncHandler } from "@/helpers/async-handler";
import { getPortalUser } from "@/helpers/portal-auth-user";
import { httpError } from "@/helpers/http-error";
import ChapterService from "@/service/chapter";
import ChapterRequestService from "@/service/chapter-request";
import MemberService, { type MemberView } from "@/service/member";
import PortalAccountService from "@/service/portal-account";
import PortalRegistrationService from "@/service/portal-registration";
import UploadService from "@/service/upload";

/** Chapter portal: chapters, members, dashboard and (counsellor only) officers. */
const ChapterPortalController = {
  // Chapters
  listChapters: asyncHandler(async (req, res) => {
    const data = await ChapterService.listChaptersForUser(getPortalUser(req));
    res.status(200).json({ message: "Chapters fetched successfully", data });
  }),

  // New-chapter requests (counsellor only)
  chapterOverview: asyncHandler(async (req, res) => {
    const data = await ChapterRequestService.getOverview(getPortalUser(req));
    res.status(200).json({ message: "Chapters fetched successfully", data });
  }),

  createChapterRequest: asyncHandler(async (req, res) => {
    const data = await ChapterRequestService.createRequest(getPortalUser(req), req.body);
    res.status(201).json({ message: "Chapter request sent for approval", data });
  }),

  cancelChapterRequest: asyncHandler(async (req, res) => {
    await ChapterRequestService.cancelRequest(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Chapter request withdrawn", data: null });
  }),

  // Program registration
  listPrograms: asyncHandler(async (_req, res) => {
    const data = await PortalRegistrationService.listOpenPrograms();
    res.status(200).json({ message: "Programs fetched successfully", data });
  }),

  registeredMembers: asyncHandler(async (req, res) => {
    const data = await PortalRegistrationService.registeredMemberIds(
      getPortalUser(req),
      req.params.id as string,
      req.query.chapterId as string,
    );
    res.status(200).json({ message: "Registered members fetched", data });
  }),

  register: asyncHandler(async (req, res) => {
    const data = await PortalRegistrationService.register(getPortalUser(req), req.body);
    res.status(201).json({ message: "Registration submitted for payment verification", data });
  }),

  listRegistrations: asyncHandler(async (req, res) => {
    const data = await PortalRegistrationService.listForChapters(
      getPortalUser(req),
      req.query.chapterId as string | undefined,
    );
    res.status(200).json({ message: "Registrations fetched successfully", data });
  }),

  // Dashboard
  dashboard: asyncHandler(async (req, res) => {
    const data = await MemberService.getDashboard(
      getPortalUser(req),
      req.query.chapterId as string | undefined,
    );
    res.status(200).json({ message: "Dashboard fetched successfully", data });
  }),

  // Members
  listMembers: asyncHandler(async (req, res) => {
    const data = await MemberService.listMembers(getPortalUser(req), {
      chapterId: req.query.chapterId as string | undefined,
      view: req.query.view as MemberView | undefined,
      search: req.query.search as string | undefined,
      rankId: req.query.rankId as string | undefined,
    });
    res.status(200).json({ message: "Members fetched successfully", data });
  }),

  getMember: asyncHandler(async (req, res) => {
    const data = await MemberService.getMember(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Member fetched successfully", data });
  }),

  addMembers: asyncHandler(async (req, res) => {
    const data = await MemberService.addMembers(
      getPortalUser(req),
      req.body.chapterId,
      req.body.members,
    );
    const count = data.length;
    res.status(201).json({
      message: `${count} member${count === 1 ? "" : "s"} submitted for approval`,
      data,
    });
  }),

  updateMember: asyncHandler(async (req, res) => {
    const data = await MemberService.updateMember(
      getPortalUser(req),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ message: "Member updated successfully", data });
  }),

  withdrawMember: asyncHandler(async (req, res) => {
    await MemberService.withdrawMember(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Member removed", data: null });
  }),

  /**
   * File upload for the portal (max 5MB). `purpose` picks the folder:
   * photos must be images; proofs may be images or PDFs.
   */
  upload: asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "No file uploaded. Send it under the 'file' field.");
    const purpose = req.params.purpose as string;
    if (purpose === "photo" && !req.file.mimetype.startsWith("image/")) {
      throw httpError(400, "Photos must be image files");
    }
    const folder = purpose === "photo" ? "member-photos" : purpose;
    const data = await UploadService.uploadFile(req.file, folder);
    res.status(201).json({ message: "File uploaded successfully", data });
  }),

  setRankHistory: asyncHandler(async (req, res) => {
    const data = await MemberService.setRankHistory(
      getPortalUser(req),
      req.params.id as string,
      req.body.entries,
    );
    res.status(200).json({ message: "Rank progress saved", data });
  }),

  // Officers (counsellor only)
  listOfficers: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.listOfficers(getPortalUser(req));
    res.status(200).json({ message: "Officers fetched successfully", data });
  }),

  assignOfficer: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.assignChapterOfficer(getPortalUser(req), req.body);
    res.status(200).json({ message: "Officer saved successfully", data });
  }),

  resendOfficerPassword: asyncHandler(async (req, res) => {
    const data = await PortalAccountService.resendOfficerPassword(
      getPortalUser(req),
      req.params.id as string,
    );
    res.status(200).json({ message: "One-time password reset", data });
  }),

  removeOfficer: asyncHandler(async (req, res) => {
    await PortalAccountService.removeOfficer(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Officer access removed", data: null });
  }),
};

export default ChapterPortalController;
