import { HttpError } from "@/server/modules/shared/errors";
import { getTransactionStatus, initiatePayment } from "@/server/modules/monnify/monnify.service";
import { consultantsRepository } from "@/server/modules/consultants/consultants.repository";
import {
  consultantReviewUpdateSchema,
  registerConsultantInputSchema,
} from "@/server/modules/consultants/consultants.schema";

// Monnify echoes paymentReference back on the webhook; this prefix is how the
// shared webhook handler tells consultant payments apart from flight bookings.
export const CONSULTANT_PAYMENT_PREFIX = "TC-";

const DEFAULT_REGISTRATION_FEE_NGN = 50_000;

export const getRegistrationFee = () => {
  const configured = Number(process.env.TRAVEL_CONSULTANT_FEE);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_REGISTRATION_FEE_NGN;
};

const buildPaymentReference = (id: string) => `${CONSULTANT_PAYMENT_PREFIX}${id}-${Date.now().toString(36)}`;

type Consultant = NonNullable<Awaited<ReturnType<typeof consultantsRepository.findById>>>;

// Creates (or refreshes) the registration, then hands back a Monnify checkout
// URL. Re-submitting with an email that hasn't paid yet reuses the same row
// and starts a fresh payment attempt, so abandoned checkouts are recoverable.
export const registerConsultant = async (input: unknown, siteOrigin: string) => {
  const data = registerConsultantInputSchema.parse(input);
  const amount = getRegistrationFee();

  const existing = await consultantsRepository.findByEmail(data.email);
  if (existing?.paymentStatus === "paid") {
    throw new HttpError("This email is already registered as a travel consultant.", 409);
  }

  const consultant = existing
    ? await consultantsRepository.update(existing.id, { ...data, amount })
    : await consultantsRepository.create({ ...data, amount });

  const paymentReference = buildPaymentReference(consultant.id);
  const payment = await initiatePayment({
    amount,
    customerName: data.fullName,
    customerEmail: data.email,
    paymentReference,
    redirectUrl: `${siteOrigin}/travel-consultancy/confirmation?id=${consultant.id}`,
    currencyCode: consultant.currency,
  });

  await consultantsRepository.update(consultant.id, {
    paymentReference,
    monnifyTransactionReference: payment.transactionReference,
  });

  return { id: consultant.id, checkoutUrl: payment.checkoutUrl as string };
};

// Payment is always re-verified against Monnify's own API — the webhook and
// the browser-return poll are only triggers, never trusted as proof of payment.
const settlePayment = async (consultant: Consultant) => {
  if (consultant.paymentStatus === "paid" || !consultant.monnifyTransactionReference) return consultant;

  const payment = await getTransactionStatus(consultant.monnifyTransactionReference);
  const fullyPaid = payment.paymentStatus === "PAID" && Number(payment.amountPaid) >= consultant.amount;
  if (!fullyPaid) return consultant;

  return consultantsRepository.update(consultant.id, { paymentStatus: "paid", paidAt: new Date() });
};

export const confirmPaymentById = async (id: string) => {
  const consultant = await consultantsRepository.findById(id);
  if (!consultant) throw new HttpError("Registration not found.", 404);
  return settlePayment(consultant);
};

export const confirmPaymentByReference = async (paymentReference: string) => {
  const consultant = await consultantsRepository.findByPaymentReference(paymentReference);
  if (!consultant) throw new HttpError("Registration not found.", 404);
  return settlePayment(consultant);
};

// Public-safe view for the post-checkout page: no contact details, since the
// id in the URL is the only thing gating it.
export const getRegistrationStatus = async (id: string) => {
  const consultant = await confirmPaymentById(id);
  return {
    paymentStatus: consultant.paymentStatus,
    firstName: consultant.fullName.split(/\s+/)[0],
  };
};

export const listConsultants = () => consultantsRepository.list();

export const getConsultantById = (id: string) => consultantsRepository.findById(id);

export const updateConsultantReview = (id: string, input: unknown) =>
  consultantsRepository.update(id, consultantReviewUpdateSchema.parse(input));

export const deleteConsultant = (id: string) => consultantsRepository.delete(id);
