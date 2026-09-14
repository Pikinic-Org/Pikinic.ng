import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedAdminUser } from "./lib/seed-admin-user";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let blockId = 0;
function p(text: string) {
  return { id: `seed-${blockId++}`, type: "paragraph" as const, text };
}
function h2(text: string) {
  return { id: `seed-${blockId++}`, type: "h2" as const, text };
}

async function seedBlogPosts() {
  const posts: Prisma.BlogPostCreateInput[] = [
    {
      slug: "uk-student-visa-checklist-2026",
      title: "The UK Student Visa Checklist Nobody Gives You",
      excerpt: "Every document, in the right order, so your application doesn't stall in review.",
      category: "VisaAndDocumentation",
      author: "Pikinic Team",
      publishedAt: new Date("2026-07-02"),
      readTime: "6 min read",
      content: [
        p("Most visa delays aren't caused by missing money — they're caused by missing paperwork nobody warned you about."),
        h2("Start with your CAS letter"),
        p("Work backwards from there: financial evidence, TB test, academic transcripts, and a clean bank statement history."),
        p("We walk every Pikinic client through this exact checklist before their appointment, so nothing comes back for clarification."),
      ],
      imageUrl: "",
      status: "published",
    },
    {
      slug: "proof-of-funds-explained",
      title: "Proof of Funds, Explained Simply",
      excerpt: "What counts, what doesn't, and how long your money needs to sit before it's 'seasoned.'",
      category: "MoneyAndFares",
      author: "Pikinic Team",
      publishedAt: new Date("2026-06-18"),
      readTime: "5 min read",
      content: [
        p("Proof of funds isn't just about having the money — it's about proving where it came from and how long it's been there."),
        p("Most institutions want 28 days of consistent balance, no unexplained large deposits right before the statement date."),
      ],
      imageUrl: "",
      status: "published",
    },
    {
      slug: "lagos-to-dubai-first-timer-guide",
      title: "First Time Flying to Dubai? Read This First",
      excerpt: "Layovers, visas on arrival, and the one packing mistake everyone makes.",
      category: "TravelTips",
      author: "Pikinic Team",
      publishedAt: new Date("2026-05-30"),
      readTime: "4 min read",
      content: [
        p("Dubai's transit visa rules trip up more travelers than any other part of the trip."),
        p("Pack layers — the flight is cold, the airport is cold, and the outside is not."),
      ],
      imageUrl: "",
      status: "published",
    },
    {
      slug: "zanzibar-vs-accra-beach-breaks",
      title: "Zanzibar or Accra: Which Beach Break Is Right for You?",
      excerpt: "Two very different trips, two very different budgets — here's how to pick.",
      category: "DestinationGuides",
      author: "Pikinic Team",
      publishedAt: new Date("2026-05-10"),
      readTime: "7 min read",
      content: [
        p("Zanzibar is the splurge trip — turquoise water, private beach lodges, longer flights."),
        p("Accra is the easy weekend — short flight, familiar food, still genuinely relaxing."),
      ],
      imageUrl: "",
      status: "published",
    },
    {
      slug: "cheapest-months-to-book-flights",
      title: "The Cheapest Months to Book International Flights from Lagos",
      excerpt: "A season-by-season breakdown of when fares actually drop.",
      category: "MoneyAndFares",
      author: "Pikinic Team",
      publishedAt: new Date("2026-04-22"),
      readTime: "5 min read",
      content: [
        p("Fares to London and Dubai dip noticeably in late January through early March."),
        p("Avoid booking in the two weeks before Christmas — that's when prices peak hardest."),
      ],
      imageUrl: "",
      status: "published",
    },
    {
      slug: "germany-tuition-free-masters-guide",
      title: "Germany's Tuition-Free Master's Programs: What's the Catch?",
      excerpt: "Almost free tuition, real living costs — here's the honest breakdown.",
      category: "DestinationGuides",
      author: "Pikinic Team",
      publishedAt: new Date("2026-09-01"),
      readTime: "6 min read",
      content: [
        p("Germany's public universities charge little to no tuition for most master's programs — but living costs and the blocked-account requirement still add up."),
      ],
      imageUrl: "",
      status: "draft",
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: post, create: post });
  }
  console.log(`Seeded ${posts.length} blog posts.`);
}

async function seedFlightOffers() {
  const offers: Prisma.FlightOfferCreateInput[] = [
    { from: "Lagos", fromCode: "LOS", to: "London", toCode: "LHR", price: 1250000, tripType: "Round trip", stops: 0 },
    { from: "Lagos", fromCode: "LOS", to: "Dubai", toCode: "DXB", price: 780000, tripType: "Round trip", stops: 0 },
    { from: "Lagos", fromCode: "LOS", to: "Johannesburg", toCode: "JNB", price: 540000, tripType: "Round trip", stops: 0 },
    { from: "Abuja", fromCode: "ABV", to: "Accra", toCode: "ACC", price: 310000, tripType: "Round trip", stops: 0 },
    { from: "Lagos", fromCode: "LOS", to: "Accra", toCode: "ACC", price: 295000, tripType: "Round trip", stops: 0 },
    { from: "Port Harcourt", fromCode: "PHC", to: "London", toCode: "LHR", price: 1390000, tripType: "Round trip", stops: 1 },
  ];

  const existing = await prisma.flightOffer.count();
  if (existing === 0) {
    await prisma.flightOffer.createMany({ data: offers });
  }
  console.log(`Seeded flight offers (existing: ${existing}).`);
}

async function seedPackages() {
  const packages: Prisma.TravelPackageCreateInput[] = [
    {
      slug: "dubai-getaway",
      destination: "Dubai",
      country: "United Arab Emirates",
      name: "Dubai Getaway",
      categories: ["International", "CityBreak"],
      priceFrom: 950000,
      duration: "5 nights",
      availability: "Contact us for available dates",
      summary: "Skyline views, desert safaris, and beach afternoons in one trip.",
      headline: "Dubai, done properly.",
      description: [
        "Five nights in a central Dubai hotel with a private airport transfer.",
        "One evening desert safari with dinner included.",
      ],
      included: ["Return flights", "4-star hotel", "Desert safari", "Airport transfers"],
      excluded: ["Travel insurance", "Personal spending", "Visa fees"],
      itinerary: [
        { day: 1, title: "Arrival", description: "Land in Dubai, transfer to hotel, evening at leisure." },
        { day: 2, title: "City tour", description: "Burj Khalifa, Dubai Mall, and the Marina." },
        { day: 3, title: "Desert safari", description: "Dune bashing, camel ride, BBQ dinner under the stars." },
      ],
      imageUrls: [],
    },
    {
      slug: "london-city-break",
      destination: "London",
      country: "United Kingdom",
      name: "London City Break",
      categories: ["International", "CityBreak"],
      priceFrom: 1650000,
      duration: "4 nights",
      availability: "Contact us for available dates",
      summary: "The essential London trip, without the planning headache.",
      headline: "London, sorted.",
      description: ["Four nights in Zone 1, walking distance to the major sights."],
      included: ["Return flights", "4-night hotel stay", "Oyster card top-up"],
      excluded: ["Meals", "Attraction tickets", "Travel insurance"],
      imageUrls: [],
    },
    {
      slug: "accra-weekender",
      destination: "Accra",
      country: "Ghana",
      name: "Accra Weekender",
      categories: ["International", "CityBreak", "Family"],
      priceFrom: 420000,
      duration: "3 nights",
      availability: "Contact us for available dates",
      summary: "A short, easy trip for a change of scenery without a long flight.",
      headline: "A weekend away, uncomplicated.",
      description: ["Three nights in Osu, close to restaurants and the beach."],
      included: ["Return flights", "3-night hotel stay"],
      excluded: ["Meals", "Local transport"],
      imageUrls: [],
    },
    {
      slug: "zanzibar-beach-escape",
      destination: "Zanzibar",
      country: "Tanzania",
      name: "Zanzibar Beach Escape",
      categories: ["Beach", "International"],
      priceFrom: 1180000,
      duration: "6 nights",
      availability: "Contact us for available dates",
      summary: "Private beach lodges and slow mornings on the Indian Ocean.",
      headline: "Six nights of doing absolutely nothing.",
      description: ["A beachfront lodge stay with breakfast included every morning."],
      included: ["Return flights", "6-night lodge stay", "Daily breakfast"],
      excluded: ["Lunch and dinner", "Water sports", "Travel insurance"],
      imageUrls: [],
    },
    {
      slug: "obudu-mountain-retreat",
      destination: "Obudu",
      country: "Nigeria",
      name: "Obudu Mountain Retreat",
      categories: ["Domestic", "Family"],
      priceFrom: 185000,
      duration: "2 nights",
      availability: "Contact us for available dates",
      summary: "Cool mountain air, without leaving the country.",
      headline: "Nigeria's own mountain escape.",
      description: ["Two nights at the Obudu ranch resort with the cable car ride included."],
      included: ["2-night resort stay", "Cable car ride"],
      excluded: ["Transport to Obudu", "Meals"],
      imageUrls: [],
    },
  ];

  for (const pkg of packages) {
    await prisma.travelPackage.upsert({ where: { slug: pkg.slug }, update: pkg, create: pkg });
  }
  console.log(`Seeded ${packages.length} packages.`);
}

async function seedWebinars() {
  const webinars: Prisma.WebinarCreateInput[] = [
    {
      slug: "uk-study-abroad-info-session-sept",
      title: "UK Study Abroad: September Info Session",
      tagline: "Everything you need to apply for the January intake.",
      coverImageUrl: "",
      dateTime: new Date("2026-09-18T18:00:00"),
      host: "Adeniyi Akintoye",
      description:
        "A live session covering UK university applications, CAS letters, proof of funds, and visa timelines for the January intake.",
      agenda: [
        { time: "6:00 PM", title: "Welcome and overview" },
        { time: "6:15 PM", title: "Choosing a course and university" },
        { time: "6:35 PM", title: "Proof of funds and visa documentation" },
        { time: "6:55 PM", title: "Live Q&A" },
      ],
      registrationLabel: "Reserve Your Spot",
      registrationUrl: "https://pikinic.ng/contact",
    },
    {
      slug: "financing-your-studies-abroad",
      title: "Financing Your Studies Abroad",
      tagline: "Loans, scholarships, and proof of funds — in one session.",
      coverImageUrl: "",
      dateTime: new Date("2026-10-09T18:00:00"),
      host: "Adeniyi Akintoye",
      description:
        "A practical walkthrough of the financial side of studying abroad, from education loans to structuring proof of funds correctly.",
      registrationLabel: "Reserve Your Spot",
      registrationUrl: "https://pikinic.ng/contact",
    },
  ];

  for (const webinar of webinars) {
    await prisma.webinar.upsert({ where: { slug: webinar.slug }, update: webinar, create: webinar });
  }
  console.log(`Seeded ${webinars.length} webinars.`);
}

async function main() {
  await seedAdminUser(prisma);
  await seedBlogPosts();
  await seedFlightOffers();
  await seedPackages();
  await seedWebinars();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
