/**
 * Adds the first two careers listings as drafts. Safe to re-run: a job that
 * already exists (matched by slug) is left alone, so edits made in the admin
 * dashboard are never overwritten.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx prisma/seed-jobs.ts
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 23:59 West Africa Time on 6 Nov 2026. Change it in the dashboard.
const closesAt = new Date("2026-11-06T22:59:00.000Z");

const jobs: Prisma.JobCreateInput[] = [
  {
    slug: "ticketing-and-vacation-sales-officer",
    title: "Ticketing and Vacation Sales Officer",
    category: "Travel & Tours",
    jobType: "Full-time",
    location: "Ikeja, Lagos",
    summary: "Manage and grow ticketing and vacation package sales for Pikinic Travels and Tours.",
    description:
      "The Ticketing and Vacation Sales Officer is a full-time, on-site role based in Lagos, responsible for managing and growing ticketing and vacation package sales for Pikinic Travels and Tours. You will oversee daily ticket sales, handle reservations and bookings, and supervise how travel and vacation packages are created and priced.",
    responsibilities: [
      "Oversee daily ticket sales operations.",
      "Handle reservations and bookings.",
      "Supervise the creation and pricing of travel and vacation packages.",
      "Work with travel partners, airlines and service providers to secure competitive offers and ensure accurate, timely ticket issuance.",
      "Respond to customer inquiries, resolve issues and provide high-quality customer service throughout the booking process.",
      "Monitor sales performance and prepare reports.",
      "Train and guide team members.",
      "Implement sales strategies to achieve revenue and customer satisfaction targets.",
    ],
    qualifications: [
      "Strong ticket sales and sales skills to manage and grow ticketing and vacation package revenue.",
      "Excellent customer service and communication skills to support clients and maintain positive relationships.",
      "Reservations experience, including handling bookings, changes and cancellations accurately.",
      "Experience in travel, tourism or airline ticketing systems and GDS platforms (e.g. Amadeus, Sabre) is highly beneficial.",
      "Strong organizational, time management and problem-solving abilities, with attention to detail and accuracy.",
      "Ability to work on-site in Ikeja, Lagos, collaborate with a team and adapt in a fast-paced, growing environment.",
    ],
    closesAt,
    status: "draft",
  },
  {
    slug: "travel-and-study-abroad-officer",
    title: "Travel and Study Abroad Officer",
    category: "Study Abroad",
    jobType: "Full-time",
    location: "Ikeja, Lagos",
    summary: "Advise clients on study abroad and travel, from applications and documents to destination compliance.",
    description:
      "The Travel and Study Abroad Officer advises clients on studying and travelling abroad, supports them with their documents and applications, and makes sure each case complies with destination country regulations. You will also take part in promotional activities and information sessions, and build relationships with schools, agencies and other partners to drive enrolments.",
    responsibilities: [
      "Respond to inquiries from prospective students and travellers.",
      "Support clients with their documents and ensure compliance with destination country regulations.",
      "Prepare proposals and information materials.",
      "Maintain accurate records of applications.",
      "Provide regular updates to clients and internal stakeholders.",
      "Take part in promotional activities and information sessions.",
      "Build relationships with schools, agencies and other relevant partners to drive enrolments.",
    ],
    qualifications: [
      "Strong client advisory and communication skills, including the ability to explain complex study abroad and travel processes in clear, accessible language.",
      "Organizational and administrative abilities, such as managing documentation, tracking application timelines and maintaining accurate records.",
      "Basic knowledge of international education systems, visa requirements and travel procedures, or willingness to learn quickly.",
      "Proficiency with standard office software and online communication tools for managing correspondence and preparing documents.",
      "Proven customer service skills, with a focus on empathy, professionalism and problem-solving in client interactions.",
      "Ability to work independently on-site in Lagos while collaborating effectively with team members.",
      "Previous experience in travel consultancy, study abroad advisory or education consulting is a must.",
      "High level of integrity, attention to detail and commitment to supporting clients achieve their international education goals.",
    ],
    closesAt,
    status: "draft",
  },
];

async function main() {
  for (const job of jobs) {
    const result = await prisma.job.upsert({ where: { slug: job.slug }, update: {}, create: job });
    console.log(`${result.slug}: ${result.status}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
