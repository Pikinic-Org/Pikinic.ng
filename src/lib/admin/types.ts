export type MediaItem = {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
};

export type BlogCategory =
  | "Travel Tips"
  | "Visa & Documentation"
  | "Money & Fares"
  | "Destination Guides";

export type BlogContentBlock =
  | { id: string; type: "h1" | "h2" | "h3" | "paragraph"; text: string }
  | { id: string; type: "image"; url: string; caption?: string };

export type BlogPostStatus = "draft" | "published";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  readTime: string;
  content: BlogContentBlock[];
  imageUrl: string;
  status: BlogPostStatus;
};

export type FlightOffer = {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  price: number;
  tripType: string;
  stops: number;
  imageUrl?: string;
};

export type FlightDeal = {
  id: string;
  fromCode: string;
  toCode: string;
  tripType: "oneway" | "roundtrip";
  discountPercent: number;
  label?: string;
  imageUrl?: string;
  active: boolean;
  validUntil?: string;
};

export type PackageCategory =
  | "Domestic"
  | "International"
  | "Beach"
  | "City Break"
  | "Family"
  | "Business";

export type ItineraryDay = {
  day: number;
  title: string;
  description: string;
};

export type TravelPackage = {
  slug: string;
  destination: string;
  country: string;
  name: string;
  categories: PackageCategory[];
  priceFrom: number;
  duration: string;
  availability: string;
  summary: string;
  headline: string;
  description: string[];
  included: string[];
  excluded: string[];
  itinerary?: ItineraryDay[];
  imageUrls: string[];
};

export type WebinarAgendaItem = {
  time: string;
  title: string;
};

export type WebinarMetric = {
  label: string;
  value: string;
};

export type WebinarTestimonial = {
  name: string;
  quote: string;
};

export type Webinar = {
  slug: string;
  title: string;
  tagline: string;
  coverImageUrl: string;
  dateTime: string;
  host: string;
  description: string;
  agenda?: WebinarAgendaItem[];
  metrics?: WebinarMetric[];
  testimonials?: WebinarTestimonial[];
  registrationLabel: string;
  registrationUrl: string;
};

export type BookingItemType = "flight" | "package";
export type BookingStatus = "paid" | "pending" | "cancelled";

export type Booking = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemType: BookingItemType;
  itemLabel: string;
  amount: number;
  status: BookingStatus;
  bookedAt: string;
};

// Live flight bookings from the flight-booking database — contact and payment
// fields only, passport details are never sent to the admin UI.
export type FlightBookingStatus = "pending_payment" | "paid" | "reserved" | "failed";

export type FlightBookingRow = {
  id: string;
  status: FlightBookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tripType: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  returnDate: string | null;
  amount: number;
  currency: string;
  pnr: string | null;
  refundStatus: string | null;
  createdAt: string;
};

export type ConsultantPaymentStatus = "pending" | "paid";
export type ConsultantReviewStatus = "registered" | "attended" | "internship";

export type TravelConsultant = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  motivation: string | null;
  referralSource: string | null;
  paymentStatus: ConsultantPaymentStatus;
  reviewStatus: ConsultantReviewStatus;
  amount: number;
  currency: string;
  paymentReference: string | null;
  monnifyTransactionReference: string | null;
  paidAt: string | null;
  adminNotes: string | null;
  createdAt: string;
};
