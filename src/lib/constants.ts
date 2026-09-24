export const siteConfig = {
  name: "Pikinic",
  description:
    "Pikinic simplifies travel, study abroad, and settling in Lagos — one trusted ecosystem for the whole journey.",
  url: "https://pikinic.ng",
  founded: 2023,
  offices: "Lagos & Osun",
  email: "admin@pikinic.ng",
  address: "LSDPC Alausa Mall, 131 Obafemi Awolowo Way, Ikeja",
  phones: ["+2348055308558", "+2349022525013"],
};

export const directorContact = {
  name: "Adeniyi Akintoye",
  whatsapp: "+234 806 579 4790",
  email: "adeniyi@pikinic.ng",
};

// Details from the official training flyer. The slot count is marketing copy
// only; registration is not capped.
export const consultancyProgramme = {
  dateLabel: "Saturday, 10 October 2026",
  venue: "Alausa Shopping Mall, Ikeja, Lagos",
  slotsLabel: "50 limited slots available",
};

// Instagram is confirmed (@pikinic). X, TikTok, and LinkedIn are still
// placeholder handles — swap for the real profiles before launch.
export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/pikinic", icon: "instagram" },
  { label: "X", href: "https://x.com/pikinic_ng", icon: "x" },
  { label: "TikTok", href: "https://tiktok.com/@pikinic.ng", icon: "tiktok" },
  { label: "LinkedIn", href: "https://linkedin.com/company/pikinic", icon: "linkedin" },
] as const;

// TODO: swap "#" for the real profile URLs — Study Abroad and Travel & Tours
// each run their own accounts, separate from the main Pikinic socials above.
export const serviceSocialLinks = [
  {
    name: "Study Abroad",
    links: [
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "TikTok", href: "#", icon: "tiktok" },
      { label: "LinkedIn", href: "#", icon: "linkedin" },
    ],
  },
  {
    name: "Travel & Tours",
    links: [
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "TikTok", href: "#", icon: "tiktok" },
      { label: "LinkedIn", href: "#", icon: "linkedin" },
    ],
  },
] as const;

export const navLinks = [
  { label: "Home", href: "/" },
  // "Services" has no page of its own — it's a hover trigger for
  // whatWeOfferLinks below, each pointing at its own subdomain.
  { label: "Services", href: "#" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export const whatWeOfferLinks = [
  { label: "Study Abroad", href: "https://studyabroad.pikinic.ng" },
  { label: "Travel & Tours", href: "https://travelsandtours.pikinic.ng" },
  { label: "Stay & Ride", href: "https://stayandride.pikinic.ng" },
  { label: "Finance", href: "https://firstmushrooom.com" },
  { label: "Book a Flight", href: "https://travelsandtours.pikinic.ng" },
];

export type Service = {
  number: string;
  name: string;
  heading: string;
  description: string;
  image: { src: string; alt: string };
  href: string;
  accent: "blue" | "orange" | "yellow" | "red";
};

export const services: Service[] = [
  {
    number: "01",
    name: "Study Abroad",
    heading: "Study abroad",
    description:
      "International school placement, university applications, and visa support at zero cost to you. We earn from the universities — so you never pay an agent fee.",
    image: { src: "/images/study-abroad.jpg", alt: "Historic university courtyard" },
    href: "https://studyabroad.pikinic.ng",
    accent: "blue",
  },
  {
    number: "02",
    name: "Travel and Tours",
    heading: "Travel and tours",
    description:
      "Flights, vacation packages, and travel planning for Nigerians going places. We find the best fares, build the best itineraries, and make sure you arrive ready.",
    image: { src: "/images/travel-tours.jpg", alt: "Friends celebrating together on a beach" },
    href: "https://travelsandtours.pikinic.ng",
    accent: "orange",
  },
  {
    number: "03",
    name: "Stay and Ride",
    heading: "Stay and ride",
    description:
      "Short-stay apartments and rental cars for arrivals, business travellers, and anyone who needs a reliable base. Book where you stay and how you move in one place.",
    image: { src: "/images/stay-ride.jpg", alt: "Warmly styled living room" },
    href: "https://stayandride.pikinic.ng",
    accent: "yellow",
  },
  {
    number: "04",
    name: "Finance",
    heading: "Finance",
    description:
      "Proof of funds, school fee payments, visa fee payments, and study loan facilitation. We handle the financial complexity of moving abroad so you're not doing it alone.",
    image: { src: "/images/finance.png", alt: "Reviewing financial documents and a passport at a sunlit desk" },
    href: "https://firstmushrooom.com",
    accent: "red",
  },
];

type Stat = {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  accent?: boolean;
};

export const testimonials = [
  {
    quote:
      "I kept thinking the UK application process would be complicated. Adeniyi walked me through every step and before I knew it I had my offer letter the next day. I wish I had done this two intakes ago.",
    name: "Adaeze O.",
    context: "MSc Data Analytics, University of Portsmouth",
  },
  {
    quote:
      "They handled my son's entire application — from school selection to CAS to flight booking. One team, zero stress. He is in the UK now and we could not be prouder.",
    name: "Folake T.",
    context: "Parent, Undergraduate Placement, UK",
  },
  {
    quote:
      "The proof of funds process had been blocking me for months. Their financial services team sorted the documentation in days. I finally have my visa. Genuinely cannot thank them enough.",
    name: "Emeka K.",
    context: "UK Student Visa, Financial Services Client",
  },
];

export const stats: Stat[] = [
  { value: "56", suffix: "+", label: "Students enrolled" },
  { value: "98", suffix: "%", label: "Visa success rate" },
  { value: "0", prefix: "₦", label: "Agent fees charged", accent: true },
  { value: "80", suffix: "+", label: "Flights booked" },
];

export const footerColumns = [
  {
    heading: "Explore",
    links: [
      { label: "Flight booking", href: "https://travelsandtours.pikinic.ng" },
      { label: "Scholarship", href: "https://studyabroad.pikinic.ng" },
      { label: "Vacation", href: "https://travelsandtours.pikinic.ng" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "Study Abroad", href: "https://studyabroad.pikinic.ng" },
      { label: "Travel and tours", href: "https://travelsandtours.pikinic.ng" },
      { label: "Stay and Ride", href: "https://stayandride.pikinic.ng" },
      { label: "Finance", href: "https://firstmushrooom.com" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Team", href: "/about#team" },
      { label: "Careers", href: "/about#careers" },
    ],
  },
];

// photo: background-removed portrait; members without one show their initials.
export const team: { name: string; role: string; photo?: string }[] = [
  { name: "Akintoye Adeniyi", role: "Director", photo: "/images/founder.png" },
  { name: "Akintoye Adepeju", role: "Admin" },
];
