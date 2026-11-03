import { asyncHandler } from "@/helpers/async-handler";
import { getPortalUser } from "@/helpers/portal-auth-user";
import { getActor } from "@/helpers/request-actor";
import AnnouncementService from "@/service/announcement";
import CensusService from "@/service/census";
import MeetingService from "@/service/meeting";

const thisYear = () => new Date().getFullYear();

/** Admin side: announcements, meeting reports, census progress. */
export const EngagementAdminController = {
  createAnnouncement: asyncHandler(async (req, res) => {
    const data = await AnnouncementService.create(req.body, getActor(req));
    res.status(201).json({ message: "Announcement published", data });
  }),
  listAnnouncements: asyncHandler(async (_req, res) => {
    res.status(200).json({ message: "Announcements fetched", data: await AnnouncementService.listForAdmin() });
  }),
  deleteAnnouncement: asyncHandler(async (req, res) => {
    await AnnouncementService.remove(req.params.id as string, getActor(req));
    res.status(200).json({ message: "Announcement deleted", data: null });
  }),
  listMeetings: asyncHandler(async (req, res) => {
    const data = await MeetingService.listAll({ churchId: req.query.churchId as string | undefined });
    res.status(200).json({ message: "Meetings fetched", data });
  }),
  censusProgress: asyncHandler(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : thisYear();
    res.status(200).json({ message: "Census progress fetched", data: await CensusService.progress(year) });
  }),
  censusRemind: asyncHandler(async (_req, res) => {
    const data = await CensusService.remind(thisYear());
    res.status(200).json({ message: `Reminded ${data.reminded} chapter(s)`, data });
  }),
};

/** Chapter portal side. */
export const EngagementPortalController = {
  listAnnouncements: asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Announcements fetched", data: await AnnouncementService.listForPortal(getPortalUser(req)) });
  }),
  readAnnouncement: asyncHandler(async (req, res) => {
    await AnnouncementService.markRead(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Marked as read", data: null });
  }),
  listMeetings: asyncHandler(async (req, res) => {
    const data = await MeetingService.list(getPortalUser(req), req.query.chapterId as string | undefined);
    res.status(200).json({ message: "Meetings fetched", data });
  }),
  createMeeting: asyncHandler(async (req, res) => {
    res.status(201).json({ message: "Meeting recorded", data: await MeetingService.create(getPortalUser(req), req.body) });
  }),
  updateMeeting: asyncHandler(async (req, res) => {
    const data = await MeetingService.update(getPortalUser(req), req.params.id as string, req.body);
    res.status(200).json({ message: "Meeting updated", data });
  }),
  deleteMeeting: asyncHandler(async (req, res) => {
    await MeetingService.remove(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Meeting deleted", data: null });
  }),
  memberAttendance: asyncHandler(async (req, res) => {
    const data = await MeetingService.attendanceFor(getPortalUser(req), req.params.id as string);
    res.status(200).json({ message: "Attendance fetched", data });
  }),
  censusStatus: asyncHandler(async (req, res) => {
    const data = await CensusService.status(getPortalUser(req), req.query.chapterId as string, Number(req.query.year));
    res.status(200).json({ message: "Census fetched", data });
  }),
  submitCensus: asyncHandler(async (req, res) => {
    res.status(201).json({ message: "Census submitted", data: await CensusService.submit(getPortalUser(req), req.body) });
  }),
};
