"use client";

import { Heart, Search, SlidersHorizontal } from "lucide-react";
import { useState, type ComponentProps, type FormEvent } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import type { Category } from "@/lib/catalog/types";

export function ToastDemo() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast("Saved to your wishlist", {
          description: "Stored on this device until accounts arrive.",
          action: { label: "Undo", onClick: () => toast("Undone") },
        })
      }
    >
      Show a toast
    </Button>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Remove from wishlist?</DialogTitle>
        <DialogDescription>
          Focus is trapped inside, Escape closes it, and focus returns to the trigger afterwards.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => toast("Removed (demo only)")}>Remove</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type FilterItem = { category: Category["id"]; total: number };

/** Filters and sort controls operating on the real sample catalog. */
export function FilterDemo({ categories, items }: { categories: Category[]; items: FilterItem[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState("any");

  const limit = maxPrice === "any" ? Infinity : Number(maxPrice) * 100;
  const matches = items.filter(
    (i) => (selected.size === 0 || selected.has(i.category)) && i.total <= limit,
  ).length;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="grid gap-6 rounded-xl border border-line bg-surface p-5 sm:grid-cols-[1fr_14rem]">
      <fieldset>
        <legend className="flex items-center gap-2 text-sm font-medium text-ink">
          <SlidersHorizontal aria-hidden className="size-4 text-ink-muted" />
          Category
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`filter-${c.id}`}
                checked={selected.has(c.id)}
                onCheckedChange={(v) => toggle(c.id, v === true)}
              />
              <Label htmlFor={`filter-${c.id}`} className="cursor-pointer font-normal text-ink-muted">
                {c.name}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>
      <div className="grid content-start gap-2">
        <Label htmlFor="max-price">Max total price</Label>
        <Select value={maxPrice} onValueChange={setMaxPrice}>
          <SelectTrigger id="max-price">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any price</SelectItem>
            <SelectItem value="100">Under $100</SelectItem>
            <SelectItem value="300">Under $300</SelectItem>
            <SelectItem value="600">Under $600</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-2 text-sm text-ink-muted tabular-nums" aria-live="polite">
          {matches} of {items.length} products match
        </p>
      </div>
    </div>
  );
}

export function FormDemo() {
  const [error, setError] = useState<string>();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("email");
    const valid = typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setError(valid ? undefined : "Enter an email address like name@example.com");
    if (valid) toast("Looks good (demo only — nothing was sent)");
  }

  return (
    <form noValidate onSubmit={onSubmit} className="grid max-w-sm gap-4">
      <Field label="Email" hint="Used for price alerts later. Not sent anywhere in this demo." error={error}>
        <Input name="email" type="email" autoComplete="email" placeholder="name@example.com" />
      </Field>
      <Field label="Disabled field">
        <Input disabled value="Read-only value" readOnly />
      </Field>
      <div>
        <Button type="submit">Validate</Button>
      </div>
    </form>
  );
}

/** For static examples: the button still responds, and says it is a demo. */
export function DemoButton(props: Omit<ComponentProps<typeof Button>, "onClick" | "asChild">) {
  return <Button {...props} onClick={() => toast("Demo control — no action in the gallery")} />;
}

export function IconButtonDemo() {
  const demo = () => toast("Demo control — no action in the gallery");
  return (
    <>
      <IconButton label="Search" icon={<Search aria-hidden />} variant="secondary" onClick={demo} />
      <IconButton label="Save" icon={<Heart aria-hidden />} onClick={demo} />
    </>
  );
}
