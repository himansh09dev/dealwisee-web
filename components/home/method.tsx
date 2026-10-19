const principles = [
  {
    title: "Total cost, not sticker price",
    body: "Offers are ranked by price plus shipping, with out-of-stock listings pushed to the bottom instead of hidden.",
  },
  {
    title: "Context before urgency",
    body: "Each price is shown against its recent weekly average and range, so a “sale” that matches last month’s price reads as typical.",
  },
  {
    title: "A list that waits with you",
    body: "Save products to your wishlist and come back to them. For now it lives on this device; accounts will sync it later.",
  },
];

export function Method() {
  return (
    <section aria-labelledby="method-title" className="page-container py-12">
      <div className="rounded-xl bg-ink px-6 py-12 text-ink-inverse sm:px-10 md:py-16">
        <p className="eyebrow text-ink-inverse/60">06 — How it reads a price</p>
        <h2
          id="method-title"
          className="mt-4 max-w-2xl font-display text-3xl tracking-tight text-balance md:text-4xl"
        >
          Three rules behind every number you see
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {principles.map((p, i) => (
            <li key={p.title} className="border-t border-ink-inverse/20 pt-5">
              <span className="font-mono text-xs text-ink-inverse/60 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-pretty text-ink-inverse/72">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
