import {
  Apple, Baby, BadgePercent, Beef, CalendarClock, Candy, Carrot, Coffee, Cookie, Croissant, CupSoda, Droplets,
  IceCreamCone, Milk, PackageMinus, Pill, Printer, RefreshCw, Soup, Sparkles, SprayCan, TrendingUp, Wheat, Package,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  Apple, Baby, BadgePercent, Beef, CalendarClock, Candy, Carrot, Coffee, Cookie, Croissant, CupSoda, Droplets,
  IceCreamCone, Milk, PackageMinus, Pill, Printer, RefreshCw, Soup, Sparkles, SprayCan, TrendingUp, Wheat,
};
export function Icon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  const C = ICONS[name] ?? Package;
  return <C className={className} size={size} strokeWidth={1.75} aria-hidden />;
}

/** Original HeladiGi wordmark (cropped from the supplied logo; never redrawn or recoloured). */
export function Logo({ className, tile, pos }: { className?: string; tile?: boolean; pos?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/wordmark.png" alt="HeladiGi" className={cn("block h-auto select-none", className)} draggable={false} />
  );
  return (
    <span className="inline-flex items-center gap-2">
      {tile ? <span className="inline-flex rounded-ctl bg-white px-2.5 py-1.5 shadow-soft">{img}</span> : <span className="inline-flex dark:rounded-ctl dark:bg-white dark:px-2 dark:py-1">{img}</span>}
      {pos && <span className="rounded-md bg-orange-100 px-1.5 py-0.5 font-heading text-[11px] font-bold tracking-wider text-navy-900">POS</span>}
    </span>
  );
}

/** Raksha mask — line rendering derived from the supplied banner artwork. */
export function RakshaMask({ className, tone = "light" }: { className?: string; tone?: "light" | "navy" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={tone === "light" ? "/brand/raksha-line-light.png" : "/brand/raksha-line-navy.png"} alt="" aria-hidden className={cn("pointer-events-none select-none", className)} draggable={false} />
  );
}

/** Soft navy / orange / sky arcs used only on login + onboarding backgrounds. */
export function Arcs({ className }: { className?: string }) {
  return (
    <svg className={cn("pointer-events-none absolute", className)} viewBox="0 0 600 600" fill="none" aria-hidden>
      <circle cx="0" cy="600" r="560" fill="#B9DDF7" fillOpacity=".06" />
      <circle cx="0" cy="600" r="450" fill="#B9DDF7" fillOpacity=".08" />
      <circle cx="0" cy="600" r="330" fill="#1A3170" />
      <path d="M0 262 A338 338 0 0 1 338 600" stroke="#FF7A00" strokeWidth="14" strokeLinecap="round" />
    </svg>
  );
}
