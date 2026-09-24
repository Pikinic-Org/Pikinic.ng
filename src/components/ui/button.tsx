import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  /** Hide the trailing arrow, e.g. for form submit buttons. */
  arrow?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  // The 10% accent: bright brand green with dark text (the green fails AA with white text).
  primary: "bg-green-500 text-neutral-900 hover:bg-green-400",
  secondary:
    "border border-neutral-900/15 bg-transparent text-neutral-900 hover:bg-neutral-900/5",
  // For deep-green and dark sections.
  inverse: "bg-neutral-0 text-green-900 hover:bg-neutral-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-sm",
  md: "h-10 gap-2 rounded-lg px-5 text-sm",
  lg: "h-12 gap-2 rounded-lg px-6 text-base",
};

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:scale-125"
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, arrow = true, children, ...props }, ref) => {
    const classes = cn(
      "group inline-flex w-fit items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
          {arrow && <Arrow />}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
        {arrow && <Arrow />}
      </button>
    );
  }
);
Button.displayName = "Button";
