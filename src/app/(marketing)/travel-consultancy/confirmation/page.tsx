import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PaymentConfirmation } from "@/components/travel-consultancy/payment-confirmation";

export const metadata: Metadata = {
  title: "Registration Status",
  robots: { index: false },
};

export default async function TravelConsultancyConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await searchParams;

  return (
    <section className="py-24 md:py-32">
      <Container className="max-w-2xl">
        <PaymentConfirmation registrationId={typeof id === "string" ? id : undefined} />
      </Container>
    </section>
  );
}
