import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDelta, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceProps = {
  /** Integer cents */
  amount: number;
  /** Optional reference price shown struck through, e.g. list price */
  compareAt?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const priceSizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl tracking-tight",
  xl: "text-4xl tracking-tightest",
} as const;

export function Price({ amount, compareAt, size = "md", className }: PriceProps) {
  const showCompare = compareAt !== undefined && compareAt > amount;
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span className={cn("font-semibold text-ink", priceSizes[size])}>{formatPrice(amount)}</span>
      {showCompare && (
        <s className="text-xs text-ink-subtle decoration-ink-subtle/60">
          <span className="sr-only">List price </span>
          {formatPrice(compareAt)}
        </s>
      )}
    </span>
  );
}

/** Threshold below which a move is treated as "about the same" (±1%). */
const FLAT = 0.01;

/**
 * Today's best price relative to its recent (weekly) average. Only render
 * this when the product has price history. Colour is never the
 * only cue: direction is also carried by the icon and the visible sign.
 */
export function PriceDelta({ ratio, className }: { ratio: number; className?: string }) {
  const tone = ratio <= -FLAT ? "signal" : ratio >= FLAT ? "rise" : "neutral";
  const Icon = tone === "signal" ? ArrowDownRight : tone === "rise" ? ArrowUpRight : Minus;
  const description =
    tone === "neutral"
      ? "About the same as its recent average price"
      : `${formatDelta(ratio)} versus its recent average price`;

  return (
    <Badge tone={tone} className={className} title={description}>
      <Icon aria-hidden strokeWidth={2.5} />
      <span aria-hidden>{tone === "neutral" ? "Typical" : `${formatDelta(ratio)} vs avg`}</span>
      <span className="sr-only">{description}</span>
    </Badge>
  );
}
