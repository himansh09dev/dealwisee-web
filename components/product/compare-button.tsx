"use client";

import { Check, Columns3 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { COMPARE_MAX, compareList, useCompareList } from "@/lib/compare";

export function CompareButton({ slug, productName }: { slug: string; productName: string }) {
  const router = useRouter();
  const selected = useCompareList().includes(slug);

  function onClick() {
    if (selected) {
      compareList.remove(slug);
      toast("Removed from comparison", { description: productName });
      return;
    }
    const result = compareList.add(slug);
    if (result === "full") {
      toast(`Comparison holds up to ${COMPARE_MAX} products`, {
        description: "Remove one to make room for this product.",
        action: { label: "Open comparison", onClick: () => router.push("/compare") },
      });
      return;
    }
    toast("Added to comparison", {
      description: productName,
      action: { label: "Compare now", onClick: () => router.push("/compare") },
    });
  }

  return (
    <Button variant="secondary" size="lg" aria-pressed={selected} onClick={onClick}>
      {selected ? <Check aria-hidden /> : <Columns3 aria-hidden />}
      {selected ? "In comparison" : "Compare"}
    </Button>
  );
}
