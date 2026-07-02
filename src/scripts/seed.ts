import "dotenv/config";
import connectDB from "@/config/db_config";
import { hashPassword } from "@/helpers/password-hasher";
import ChurchModel from "@/models/church";
import ExecutiveModel from "@/models/executive";
import OfficeModel from "@/models/offices";
import mongoose from "mongoose";
import {
  DEFAULT_ADMIN,
  SEED_CHAPTERS,
  SEED_OFFICES,
} from "./seed-data";

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

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN.email;
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN.password;
  const existing = await ExecutiveModel.findOne({ email }).exec();
  if (existing) {
    return { created: false, email };
  }

  const directorOffice = await OfficeModel.findOne({ name: "Director" }).exec();
  const defaultChapter = await ChurchModel.findOne().sort({ chapter: 1 }).exec();

  if (!directorOffice || !defaultChapter) {
    throw new Error("Seed offices and chapters before creating the admin user.");
  }

  const hashedPassword = await hashPassword(password);
  const currentYear = new Date().getFullYear();

  await ExecutiveModel.create({
    name: DEFAULT_ADMIN.name,
    email,
    phone: DEFAULT_ADMIN.phone,
    office_id: directorOffice._id,
    church_id: defaultChapter._id,
    start_year: currentYear,
    end_year: null,
    status: "active",
    password: hashedPassword,
    title: DEFAULT_ADMIN.title,
    description: DEFAULT_ADMIN.description,
  });

  return { created: true, email };
}

async function main() {
  await connectDB();

  const officesCreated = await seedOffices();
  const chaptersCreated = await seedChapters();
  const admin = await seedAdminUser();

  console.log("\nPBA RA database seed complete");
  console.log(`  Offices created:  ${officesCreated}`);
  console.log(`  Chapters created: ${chaptersCreated}`);
  console.log(
    `  Admin user:       ${admin.created ? "created" : "already exists"} (${admin.email})`,
  );

  if (admin.created) {
    const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN.password;
    console.log(`  Login password:   ${password}`);
    console.log("  Change this password after first login.\n");
  } else {
    console.log("");
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
