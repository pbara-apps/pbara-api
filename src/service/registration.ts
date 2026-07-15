import ChurchDao from "@/dao/church";
import RankDao from "@/dao/rank";
import RegistrationCounterDao from "@/dao/registration-counter";
import RegistrationDao from "@/dao/registration";
import RegistrationProgramDao from "@/dao/registration-program";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import {
  buildRegistrationCodes,
  resolveProgramCode,
} from "@/helpers/registration-code";
import { RegistrationTypes } from "@/types/_types";

function httpError(message: string, status: number) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

function isModeAllowed(
  mode: "single" | "bulk" | "both",
  type: "single" | "bulk",
) {
  if (mode === "both") return true;
  return mode === type;
}

const RegistrationService = {
  async create(data: RegistrationTypes) {
    const program = await RegistrationProgramDao.findById(data.programId);
    if (!program) {
      throw httpError("Program not found", 404);
    }
    if (!program.isActive) {
      throw httpError("Program is not accepting registrations", 400);
    }
    if (
      program.registrationDeadline &&
      new Date() > new Date(program.registrationDeadline)
    ) {
      throw httpError("Registration deadline has passed", 400);
    }
    if (!isModeAllowed(program.registrationMode, data.registrationType)) {
      throw httpError(
        `This program only allows ${program.registrationMode} registration`,
        400,
      );
    }
    if (data.registrationType === "single" && data.entries.length !== 1) {
      throw httpError("Single registration must have exactly one entry", 400);
    }

    for (const [index, entry] of data.entries.entries()) {
      const rank = await RankDao.findById(entry.rank);
      if (!rank) {
        throw httpError(`Invalid rank for entry ${index + 1}`, 400);
      }
      const church = await ChurchDao.findById(entry.church);
      if (!church) {
        throw httpError(`Invalid church for entry ${index + 1}`, 400);
      }
      if (church.status !== "active") {
        throw httpError(`Church for entry ${index + 1} is not active`, 400);
      }
    }

    const programCode = resolveProgramCode({
      programCode: program.programCode,
      slug: program.slug,
    });
    const year = new Date().getFullYear();
    const { start } = await RegistrationCounterDao.nextSerial(
      data.programId,
      data.entries.length,
    );
    const codes = buildRegistrationCodes({
      programCode,
      year,
      startSerial: start,
      count: data.entries.length,
    });

    const entries = data.entries.map((entry, index) => ({
      ...entry,
      registrationCode: codes[index]!,
    }));

    return await RegistrationDao.create({
      ...data,
      entries,
      status: "pending",
    });
  },

  async getById(id: string) {
    const registration = await RegistrationDao.findById(id);
    if (!registration) {
      throw httpError("Registration not found", 404);
    }
    return registration;
  },

  async getPendingCount() {
    return await RegistrationDao.countPending();
  },

  async list(filters: {
    programId?: string;
    category?: string;
    status?: "pending" | "verified" | "rejected";
    page: number;
    limit: number;
  }) {
    let programIds;
    if (filters.category && !filters.programId) {
      programIds = await RegistrationProgramDao.findIdsByCategory(
        filters.category,
      );
      if (programIds.length === 0) {
        return {
          items: [],
          page: filters.page,
          limit: filters.limit,
          total: 0,
          totalPages: 0,
        };
      }
    }

    const { items, total } = await RegistrationDao.findFiltered({
      programId: filters.programId,
      programIds,
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
    });

    return {
      items,
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / filters.limit),
    };
  },

  async updateStatus(
    id: string,
    data: { status: "verified" | "rejected"; adminNote?: string | null },
    actor?: AuditActor,
  ) {
    const existing = await RegistrationDao.findById(id);
    if (!existing) {
      throw httpError("Registration not found", 404);
    }

    const updated = await RegistrationDao.updateStatus(id, {
      status: data.status,
      adminNote: data.adminNote ?? null,
    });

    await logAudit({
      action: "updated",
      entityType: "registration",
      entityId: id,
      entityTitle: existing.registrantName,
      actor,
      detail: data.status,
    });

    return updated;
  },
};

export default RegistrationService;
