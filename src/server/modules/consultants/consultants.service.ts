import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { consultantProgramme } from "@/lib/constants";
import { HttpError } from "@/server/modules/shared/errors";
import { getTransactionStatus } from "@/server/modules/monnify/monnify.service";
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

// Placeholder so the payment screen can be previewed before the real account
// is known. Set all three env vars on the host to replace it.
const PLACEHOLDER = "xxxxxxxxx";

// Shown after registering.
export const getBankDetails = () => {
  const bankName = process.env.CONSULTANT_BANK_NAME?.trim();
  const accountNumber = process.env.CONSULTANT_ACCOUNT_NUMBER?.trim();
  const accountName = process.env.CONSULTANT_ACCOUNT_NAME?.trim();
  return bankName && accountNumber && accountName
    ? { bankName, accountNumber, accountName }
    : { bankName: PLACEHOLDER, accountNumber: PLACEHOLDER, accountName: PLACEHOLDER };
};

// The code people type into their transfer narration, e.g. TC-7K4PQ. No 0/O or
// 1/I, so it survives being read out or retyped.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const buildPaymentCode = () =>
  `TC-${Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("")}`;

const consultantIdFromReference = (paymentReference: string) =>
  paymentReference.slice(CONSULTANT_PAYMENT_PREFIX.length, paymentReference.lastIndexOf("-"));

type Consultant = NonNullable<Awaited<ReturnType<typeof consultantsRepository.findById>>>;

const isUniqueViolation = (error: unknown, field: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002" &&
  JSON.stringify(error.meta ?? {}).includes(field);

// One registration per email. Someone who registers again before paying keeps
// their row and payment code, with their details refreshed, so a second scan
// of the QR code never creates a duplicate or a second code to chase.
export const registerForBankTransfer = async (input: unknown) => {
  const data = registerConsultantInputSchema.parse(input);
  const amount = getRegistrationFee();

  const existing = await consultantsRepository.findByEmail(data.email);
  if (existing?.paymentStatus === "paid") {
    throw new HttpError(
      "This email is already registered and paid. Message us on WhatsApp if you need anything.",
      409
    );
  }

  let consultant: Consultant | null = null;
  if (existing) {
    consultant = await consultantsRepository.update(existing.id, {
      ...data,
      amount,
      programme: consultantProgramme.code,
      paymentCode: existing.paymentCode ?? buildPaymentCode(),
    });
  } else {
    // A clash on the random code is rare but possible, so retry with a new one.
    for (let attempt = 0; attempt < 5 && !consultant; attempt++) {
      try {
        consultant = await consultantsRepository.create({
          ...data,
          amount,
          programme: consultantProgramme.code,
          paymentCode: buildPaymentCode(),
        });
      } catch (error) {
        if (isUniqueViolation(error, "paymentCode")) continue;
        // Two submissions with the same new email raced; the other one won.
        if (isUniqueViolation(error, "email")) {
          consultant = await consultantsRepository.findByEmail(data.email);
          break;
        }
        throw error;
      }
    }
  }

  if (!consultant?.paymentCode) throw new HttpError("Could not complete your registration. Please try again.", 500);

  return {
    firstName: consultant.fullName.split(/\s+/)[0],
    fullName: consultant.fullName,
    paymentCode: consultant.paymentCode,
    amount: consultant.amount,
  };
};

// Payment is always re-verified against Monnify's own API — the webhook is
// only a trigger, never trusted as proof of payment. Kept for registrations
// made through the earlier Monnify checkout.
const settlePayment = async (
  consultant: Consultant,
  attempt: { paymentReference: string; transactionReference: string }
) => {
  if (consultant.paymentStatus === "paid") return consultant;

  const payment = await getTransactionStatus(attempt.transactionReference);
  const fullyPaid = payment.paymentStatus === "PAID" && Number(payment.amountPaid) >= consultant.amount;
  if (!fullyPaid) return consultant;

  // A transaction can only settle the registration its own reference names.
  if (payment.paymentReference && payment.paymentReference !== attempt.paymentReference) return consultant;

  return consultantsRepository.update(consultant.id, {
    paymentStatus: "paid",
    paidAt: new Date(),
    paymentReference: attempt.paymentReference,
    monnifyTransactionReference: attempt.transactionReference,
  });
};

// Called from the Monnify webhook. Looks the registration up by the id embedded
// in the reference rather than the stored reference, so a payment made on an
// older attempt (after the person retried) is still credited to them.
export const confirmPaymentByReference = async (paymentReference: string, transactionReference: string) => {
  const consultant = await consultantsRepository.findById(consultantIdFromReference(paymentReference));
  if (!consultant) throw new HttpError("Registration not found.", 404);
  return settlePayment(consultant, { paymentReference, transactionReference });
};

export const listConsultants = () => consultantsRepository.list();

export const getConsultantById = (id: string) => consultantsRepository.findById(id);

// paidAt follows the payment status, so marking someone paid by mistake and
// undoing it leaves no stale date behind.
export const updateConsultantReview = async (id: string, input: unknown) => {
  const { paymentStatus, ...rest } = consultantReviewUpdateSchema.parse(input);
  const data: Prisma.TravelConsultantUpdateInput = { ...rest };

  if (paymentStatus) {
    const consultant = await consultantsRepository.findById(id);
    if (!consultant) throw new HttpError("Travel consultant not found.", 404);
    if (paymentStatus !== consultant.paymentStatus) {
      data.paymentStatus = paymentStatus;
      data.paidAt = paymentStatus === "paid" ? new Date() : null;
    }
  }

  return consultantsRepository.update(id, data);
};

export const deleteConsultant = (id: string) => consultantsRepository.delete(id);
