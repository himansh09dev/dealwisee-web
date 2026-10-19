import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceHistoryChartProps = {
  /** Weekly prices, oldest first, integer cents. The last point is "now". */
  series: number[];
  /** Compact sparkline without labels */
  variant?: "spark" | "full";
  className?: string;
};

const W = 320;

/**
 * Hand-rolled SVG: 12 points don't justify a charting dependency. The chart
 * is decorative for screen readers; the summary sentence carries the data.
 */
export function PriceHistoryChart({ series, variant = "full", className }: PriceHistoryChartProps) {
  const H = variant === "spark" ? 48 : 120;
  const pad = variant === "spark" ? 4 : 10;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const avg = series.reduce((a, b) => a + b, 0) / series.length;

  // Each week owns an equal-width step, so "now" gets a visible segment too.
  const x = (i: number) => (i / series.length) * W;
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);

  // Step line: a price holds until it changes, so steps are more honest than curves.
  const line = series
    .map((v, i) => (i === 0 ? `M0 ${y(v)}` : `H${x(i)} V${y(v)}`))
    .join(" ")
    .concat(` H${W}`);
  const area = `${line} V${H} H0 Z`;
  const last = series[series.length - 1] ?? min;
  const first = series[0] ?? max;
  const down = last <= first;

  const summary = `Over 12 weeks the lowest price ranged from ${formatPrice(min)} to ${formatPrice(max)}; it is ${formatPrice(last)} now.`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn("block w-full overflow-visible", variant === "spark" ? "h-12" : "h-32")}
        aria-hidden
      >
        {variant === "full" && (
          <line
            x1="0"
            x2={W}
            y1={y(avg)}
            y2={y(avg)}
            stroke="var(--line-strong)"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={area} fill={down ? "var(--signal)" : "var(--ink-muted)"} fillOpacity={0.08} />
        <path
          d={line}
          fill="none"
          stroke={down ? "var(--signal)" : "var(--ink-muted)"}
          strokeWidth={1.75}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {variant === "full" ? (
        <figcaption className="mt-2 flex justify-between text-xs text-ink-muted tabular-nums">
          <span>12 weeks ago</span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-px w-3 border-t border-dashed border-line-strong" />
            12-wk avg {formatPrice(Math.round(avg))}
          </span>
          <span>Now</span>
          <span className="sr-only">{summary}</span>
        </figcaption>
      ) : (
        <figcaption className="sr-only">{summary}</figcaption>
      )}
    </figure>
  );
}
