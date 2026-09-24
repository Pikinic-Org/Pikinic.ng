"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { navLinks, siteConfig, whatWeOfferLinks } from "@/lib/constants";

function Mark({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="24"
      viewBox="0 0 62 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M42.5978 0C42.3793 0 41.7808 0.0221622 41.4419 0.0348263L41.4103 0.0379923H41.3849L11.9539 1.84579L16.1086 10.7297L41.86 9.14664C41.9866 9.14348 42.4521 9.12131 42.5978 9.12131C47.9843 9.12131 52.3733 13.5031 52.3733 18.8917C52.3733 24.2771 47.9843 28.6588 42.5978 28.6588C42.4268 28.6588 42.2653 28.6588 42.1323 28.6525L32.7273 28.0826L26.8974 37.4604H11.2192L15.6367 26.9809L6.32353 26.4015L0.52218 38.7965C-1.17516 42.4215 1.47218 46.5849 5.47803 46.5849H28.7911C30.5676 46.5849 32.2333 45.7237 33.2593 44.2705L38.0156 37.5395L41.6003 37.7612H41.6383C41.822 37.7707 42.0151 37.777 42.221 37.7802C51.36 37.9416 59.3812 31.6381 61.1292 22.6687C63.482 10.6062 54.2575 0 42.5978 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        open
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border-primary/60 bg-background-primary/85 backdrop-blur-md"
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 text-text-primary transition-opacity hover:opacity-80",
            open && "pointer-events-none opacity-0"
          )}
        >
          <Mark className="text-green-700" />
          <span className="text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop nav — centered */}
        <div className="hidden flex-1 md:flex md:justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-border-primary bg-neutral-900/[0.04] p-1.5">
          {navLinks.map((link) => {
            const active = pathname === link.href;

            if (link.label === "Services") {
              return (
                <div key={link.label} className="group relative">
                  <span className="flex cursor-default items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-900/[0.06]">
                    {link.label}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>

                  <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="w-56 rounded-xl border border-border-primary bg-surface-primary p-1.5 shadow-lg">
                      {whatWeOfferLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-900/[0.06]"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-green-500/20 text-green-900"
                    : "text-text-primary hover:bg-neutral-900/[0.06]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        </div>

        {/* Right-side actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button href="https://travelsandtours.pikinic.ng" size="md" variant="secondary">
            Book a flight
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "relative z-50 flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden",
            open ? "text-neutral-0" : "text-text-primary"
          )}
        >
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-[2px] w-full bg-current transition-transform duration-300",
                open && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[7px] h-[2px] w-full bg-current transition-opacity duration-200",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[14px] h-[2px] w-full bg-current transition-transform duration-300",
                open && "-translate-y-[7px] -rotate-45"
              )}
            />
          </span>
        </button>
      </Container>
    </header>

    {/* Mobile panel — rendered outside <header> so backdrop-blur there doesn't
        turn it into the containing block for this fixed-position overlay */}
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col overflow-hidden bg-green-900 text-neutral-0 transition-opacity duration-300 md:hidden",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >

        <nav className="relative flex flex-1 flex-col items-start justify-center gap-2 px-8">
          {navLinks.map((link, i) => (
            <div key={link.label} className="w-full">
              {link.label === "Services" ? (
                <span
                  className={cn(
                    "block text-4xl font-semibold tracking-tight",
                    open && "reveal"
                  )}
                  style={open ? { animationDelay: `${0.1 + i * 0.07}s` } : undefined}
                >
                  {link.label}
                </span>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    "text-4xl font-semibold tracking-tight",
                    open && "reveal"
                  )}
                  style={open ? { animationDelay: `${0.1 + i * 0.07}s` } : undefined}
                >
                  {link.label}
                </Link>
              )}

              {link.label === "Services" && (
                <div className="mt-3 flex flex-col gap-2">
                  {whatWeOfferLinks.map((item, j) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "text-base font-medium text-neutral-0/60",
                        open && "reveal"
                      )}
                      style={
                        open
                          ? { animationDelay: `${0.1 + i * 0.07 + (j + 1) * 0.05}s` }
                          : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div
          className={cn("px-8 py-8", open && "reveal")}
          style={open ? { animationDelay: `${0.1 + navLinks.length * 0.07}s` } : undefined}
        >
          <Button
            href="https://travelsandtours.pikinic.ng"
            size="lg"
            variant="inverse"
            className="w-full"
          >
            Book a flight
          </Button>
        </div>
        <div
          className={cn("flex items-center justify-center gap-2 pb-8", open && "reveal")}
          style={open ? { animationDelay: `${0.2 + navLinks.length * 0.07}s` } : undefined}
        >
          <Mark className="text-neutral-0" />
          <span className="text-sm font-semibold tracking-tight text-neutral-0">
            {siteConfig.name}
          </span>
        </div>
    </div>
    </>
  );
}
