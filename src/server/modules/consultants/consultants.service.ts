import { Prisma } from "@/generated/prisma/client";
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

// Reference shape: TC-<consultantId>-<attempt>. Ids are cuids (no hyphens), so
// the id can always be recovered from a reference even after a newer payment
// attempt has replaced the one stored on the row.
const buildPaymentReference = (id: string) => `${CONSULTANT_PAYMENT_PREFIX}${id}-${Date.now().toString(36)}`;

const consultantIdFromReference = (paymentReference: string) =>
  paymentReference.slice(CONSULTANT_PAYMENT_PREFIX.length, paymentReference.lastIndexOf("-"));

type Consultant = NonNullable<Awaited<ReturnType<typeof consultantsRepository.findById>>>;

// Payment is always re-verified against Monnify's own API — the webhook and
// the browser-return poll are only triggers, never trusted as proof of payment.
// `attempt` lets the webhook settle a specific (possibly older) payment attempt.
const settlePayment = async (
  consultant: Consultant,
  attempt: { paymentReference: string; transactionReference: string } | null = null
) => {
  if (consultant.paymentStatus === "paid") return consultant;

  const transactionReference = attempt?.transactionReference ?? consultant.monnifyTransactionReference;
  if (!transactionReference) return consultant;

  const payment = await getTransactionStatus(transactionReference);
  const fullyPaid = payment.paymentStatus === "PAID" && Number(payment.amountPaid) >= consultant.amount;
  if (!fullyPaid) return consultant;

  // A transaction can only settle the registration its own reference names.
  if (attempt && payment.paymentReference && payment.paymentReference !== attempt.paymentReference) return consultant;

  return consultantsRepository.update(consultant.id, {
    paymentStatus: "paid",
    paidAt: new Date(),
    paymentReference: attempt?.paymentReference ?? consultant.paymentReference,
    monnifyTransactionReference: transactionReference,
  });
};

// One registration per email. Re-submitting with an email that hasn't paid
// reuses the same row (replacing its details) and starts a fresh payment
// attempt, so abandoned checkouts are recoverable without duplicate rows.
export const registerConsultant = async (input: unknown, siteOrigin: string) => {
  const data = registerConsultantInputSchema.parse(input);
  const amount = getRegistrationFee();

  let existing = await consultantsRepository.findByEmail(data.email);

  // The previous attempt may have been paid without us knowing yet (delayed
  // webhook, or no webhook in local dev). Check before opening a second one,
  // so nobody is asked to pay twice.
  if (existing && existing.paymentStatus !== "paid") existing = await settlePayment(existing);

  if (existing?.paymentStatus === "paid") {
    throw new HttpError("This email is already registered as a travel consultant.", 409);
  }

  let consultant: Consultant;
  try {
    consultant = existing
      ? await consultantsRepository.update(existing.id, { ...data, amount })
      : await consultantsRepository.create({ ...data, amount });
  } catch (error) {
    // Two submissions with the same new email raced; the unique index on email
    // let exactly one of them create the row.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError("A registration for this email is already in progress. Please try again.", 409);
    }
    throw error;
  }

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

export const confirmPaymentById = async (id: string) => {
  const consultant = await consultantsRepository.findById(id);
  if (!consultant) throw new HttpError("Registration not found.", 404);
  return settlePayment(consultant);
};

// Called from the Monnify webhook. Looks the registration up by the id embedded
// in the reference rather than the stored reference, so a payment made on an
// older attempt (after the person retried) is still credited to them.
export const confirmPaymentByReference = async (paymentReference: string, transactionReference: string) => {
  const consultant = await consultantsRepository.findById(consultantIdFromReference(paymentReference));
  if (!consultant) throw new HttpError("Registration not found.", 404);
  return settlePayment(consultant, { paymentReference, transactionReference });
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
