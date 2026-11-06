import { chatWhatsappHref } from "@/lib/constants";
import { SocialIcon } from "@/components/ui/social-icon";

// "Chat on WhatsApp", fixed bottom-right on every marketing page. Icon only on phones, so it
// covers less of the page. z-30 sits under the mobile menu (z-40), which covers it when open.
export function WhatsappChat() {
  return (
    <a
      href={chatWhatsappHref}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with Pikinic on WhatsApp"
      className="fixed bottom-4 right-4 z-30 inline-flex size-12 items-center justify-center gap-2 rounded-full bg-green-500 text-neutral-900 shadow-lg transition-colors hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 md:bottom-6 md:right-6 md:h-12 md:w-auto md:rounded-lg md:px-5"
    >
      <SocialIcon icon="whatsapp" className="size-5 shrink-0" />
      <span className="hidden text-sm font-medium md:inline">Chat on WhatsApp</span>
    </a>
  );
}
