import "dotenv/config";
import connectDB from "@/config/db_config";
import { hashPassword } from "@/helpers/password-hasher";
import AccountModel from "@/models/account";
import ChurchModel from "@/models/church";
import ExecutiveModel from "@/models/executive";
import OfficeModel from "@/models/offices";
import mongoose from "mongoose";
import { DEFAULT_ADMIN, SEED_CHAPTERS, SEED_OFFICES } from "./seed-data";

async function seedOffices() {
  const existing = await OfficeModel.find(
    { name: { $in: SEED_OFFICES.map((o) => o.name) } },
    { name: 1 },
  ).exec();
  const existingNames = new Set(existing.map((o) => o.name));
  const toInsert = SEED_OFFICES.filter((o) => !existingNames.has(o.name));
  if (toInsert.length === 0) return 0;
  await OfficeModel.insertMany(toInsert, { ordered: false });
  return toInsert.length;
}

async function seedChapters() {
  const existing = await ChurchModel.find(
    { name: { $in: SEED_CHAPTERS.map((c) => c.name) } },
    { name: 1 },
  ).exec();
  const existingNames = new Set(existing.map((c) => c.name));
  const toInsert = SEED_CHAPTERS.filter((c) => !existingNames.has(c.name));
  if (toInsert.length === 0) return 0;
  await ChurchModel.insertMany(toInsert, { ordered: false });
  return toInsert.length;
}

/**
 * Makes sure a super admin login exists: an Account with super_admin access,
 * linked to a "Director" executive profile (created if missing).
 */
async function seedAdminUser() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN.email).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN.password;

  const existing = await AccountModel.findOne({ email }).exec();
  if (existing) {
    if (existing.admin?.role !== "super_admin" || !existing.admin?.active) {
      existing.set("admin", {
        role: "super_admin",
        executive: existing.admin?.executive ?? null,
        is_finance: existing.admin?.is_finance ?? false,
        active: true,
      });
      await existing.save();
      return { created: false, email, updatedRole: true };
    }
    return { created: false, email, updatedRole: false };
  }

  const directorOffice = await OfficeModel.findOne({ name: "Director" }).exec();
  const defaultChapter = await ChurchModel.findOne()
    .sort({ chapter: 1 })
    .exec();

  if (!directorOffice || !defaultChapter) {
    throw new Error(
      "Seed offices and chapters before creating the admin user.",
    );
  }

  const executive =
    (await ExecutiveModel.findOne({ email }).exec()) ??
    (await ExecutiveModel.create({
      name: DEFAULT_ADMIN.name,
      email,
      phone: DEFAULT_ADMIN.phone,
      office_id: directorOffice._id,
      church_id: defaultChapter._id,
      start_year: new Date().getFullYear(),
      end_year: null,
      status: "active",
      title: DEFAULT_ADMIN.title,
      description: DEFAULT_ADMIN.description,
    }));

  await AccountModel.create({
    name: executive.name,
    email,
    phone: executive.phone,
    password: await hashPassword(password),
    // The seed password is known to whoever runs the seed; still ask them to change it.
    has_changed_password: false,
    admin: { role: "super_admin", executive: executive._id, is_finance: false, active: true },
  });

  return { created: true, email };
}

async function main() {
  await connectDB();

  const officesCreated = await seedOffices();
  const chaptersCreated = await seedChapters();
  const admin = await seedAdminUser();

  if (admin.created) {
    const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN.password;
  } else {
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
