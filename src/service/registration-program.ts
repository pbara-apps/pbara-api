import RegistrationProgramDao from "@/dao/registration-program";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { normalizeProgramCode } from "@/helpers/registration-code";
import { RegistrationProgramTypes } from "@/types/_types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(title: string, excludeId?: string) {
  let base = slugify(title) || "program";
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await RegistrationProgramDao.findBySlug(slug);
    if (!existing || String(existing._id) === excludeId) break;
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
}

function toDeadlineDate(value?: string | Date | null) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value;
  // End of local calendar day for YYYY-MM-DD deadlines
  return new Date(`${value}T23:59:59.999`);
}

function httpError(message: string, status: number) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

type ProgramInput = RegistrationProgramTypes;

const RegistrationProgramService = {
  async create(data: ProgramInput, actor?: AuditActor) {
    const slug = data.slug?.trim() || (await uniqueSlug(data.title));
    const program = await RegistrationProgramDao.create({
      ...data,
      slug,
      programCode: normalizeProgramCode(data.programCode),
      registrationDeadline: toDeadlineDate(data.registrationDeadline),
      isActive: data.isActive ?? true,
    });
    await logAudit({
      action: "created",
      entityType: "program",
      entityId: String(program._id),
      entityTitle: program.title,
      actor,
      detail: program.category,
    });
    return program;
  },

  async getAll() {
    return await RegistrationProgramDao.findAll();
  },

  async getActive() {
    return await RegistrationProgramDao.findActive();
  },

  async getActiveBySlug(slug: string) {
    const program = await RegistrationProgramDao.findActiveBySlug(slug);
    if (!program) {
      throw httpError("Program not found", 404);
    }
    return program;
  },

  async getById(id: string) {
    const program = await RegistrationProgramDao.findById(id);
    if (!program) {
      throw httpError("Program not found", 404);
    }
    return program;
  },

  async update(id: string, data: Partial<ProgramInput>, actor?: AuditActor) {
    const existing = await RegistrationProgramDao.findById(id);
    if (!existing) {
      throw httpError("Program not found", 404);
    }

    const payload: Partial<ProgramInput> & {
      registrationDeadline?: Date | string | null;
    } = { ...data };

    if (data.title && !data.slug) {
      payload.slug = await uniqueSlug(data.title, id);
    } else if (data.slug) {
      payload.slug = data.slug.trim();
    }

    if (data.registrationDeadline !== undefined) {
      payload.registrationDeadline = toDeadlineDate(data.registrationDeadline);
    }

    if (data.programCode !== undefined) {
      payload.programCode = normalizeProgramCode(data.programCode);
    }

    const updated = await RegistrationProgramDao.update(id, payload);
    await logAudit({
      action: "updated",
      entityType: "program",
      entityId: id,
      entityTitle: updated?.title ?? existing.title,
      actor,
    });
    return updated;
  },

  async deactivate(id: string, actor?: AuditActor) {
    const existing = await RegistrationProgramDao.findById(id);
    if (!existing) {
      throw httpError("Program not found", 404);
    }
    const updated = await RegistrationProgramDao.deactivate(id);
    await logAudit({
      action: "updated",
      entityType: "program",
      entityId: id,
      entityTitle: existing.title,
      actor,
      detail: "deactivated",
    });
    return updated;
  },
};

export default RegistrationProgramService;
