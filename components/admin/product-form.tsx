"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";

import { saveProductAction } from "@/app/admin/actions";
import { Button, IconButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Label } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "@/components/ui/toaster";
import { productFormSchema, slugify, type ProductFormValues } from "@/lib/catalog/product-form";
import type { Category, Store } from "@/lib/catalog/types";

type ProductFormProps = {
  /** null when creating */
  originalSlug: string | null;
  defaultValues: ProductFormValues;
  categories: Category[];
  stores: Store[];
};

const topLevelFields = new Set<string>(Object.keys(productFormSchema.shape));
function isTopLevelField(key: string): key is FieldPath<ProductFormValues> {
  return topLevelFields.has(key);
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-line pt-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <legend className="font-display text-xl tracking-tight text-ink">{title}</legend>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      <div className="grid min-w-0 gap-5">{children}</div>
    </fieldset>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const valid = productFormSchema.shape.imageSrc.safeParse(src).success;
  return (
    <div className="relative grid aspect-[4/3] w-full max-w-xs place-items-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-sunken text-xs text-ink-subtle">
      {valid ? (
        // unoptimized: arbitrary admin-entered hosts aren't in images.remotePatterns.
        <Image src={src} alt={alt || "Image preview"} fill unoptimized sizes="20rem" className="object-cover" />
      ) : (
        "Preview appears when the URL is valid"
      )}
    </div>
  );
}

export function ProductForm({ originalSlug, defaultValues, categories, stores }: ProductFormProps) {
  const router = useRouter();
  const id = useId();
  const isEdit = originalSlug !== null;

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getFieldState,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: "onTouched",
    defaultValues,
  });
  /**
   * register() leaves server HTML empty until hydration fills the inputs;
   * rendering defaultValue too means the first paint already shows the data.
   */
  function bind(name: FieldPath<ProductFormValues>) {
    const value = getValues(name);
    return { ...register(name), defaultValue: typeof value === "string" ? value : undefined };
  }

  const specs = useFieldArray({ control, name: "specs" });
  const offers = useFieldArray({ control, name: "offers" });
  const [imageSrc, imageAlt] = useWatch({ control, name: ["imageSrc", "imageAlt"] });

  async function onSubmit(values: ProductFormValues) {
    const result = await saveProductAction(values, originalSlug);
    if (result.ok) {
      toast(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      return;
    }
    for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
      if (isTopLevelField(field) && messages[0]) setError(field, { message: messages[0] });
    }
    setError("root.server", { type: result.error.code, message: result.error.message });
  }

  const serverError = errors.root?.server;
  const offersError = errors.offers?.root?.message ?? errors.offers?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10">
      {serverError?.message &&
        (serverError.type === "READ_ONLY" ? (
          <FormAlert tone="info" title="Your input is valid, but nothing was saved">
            {serverError.message}
          </FormAlert>
        ) : (
          <FormAlert tone="error" title="Couldn't save">
            {serverError.message}
          </FormAlert>
        ))}

      <Section title="Basics" description="What shoppers see first.">
        <Field label="Product name" error={errors.name?.message}>
          <Input
            {...register("name", {
              onChange: (e: { target: { value: string } }) => {
                // Auto-fill the slug until someone edits it by hand.
                if (!isEdit && !getFieldState("slug").isDirty) {
                  setValue("slug", slugify(e.target.value), { shouldValidate: getFieldState("slug").isTouched });
                }
              },
            })}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand" error={errors.brand?.message}>
            <Input {...bind("brand")} />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <NativeSelect {...bind("category")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field
          label="URL slug"
          hint={isEdit ? "Changing this changes the product's URL." : "Generated from the name; edit if needed."}
          error={errors.slug?.message}
        >
          <Input {...bind("slug")} spellCheck={false} />
        </Field>
        <Field label="Summary" hint="One line, e.g. key specs separated by ·" error={errors.summary?.message}>
          <Input {...bind("summary")} />
        </Field>
      </Section>

      <Section title="Image" description="One primary photo. Uploads arrive with storage in a later phase.">
        <Field label="Image URL" hint="https:// URL or a path under /images/" error={errors.imageSrc?.message}>
          <Input {...bind("imageSrc")} inputMode="url" spellCheck={false} />
        </Field>
        <Field label="Alt text" hint="Describe what's in the photo." error={errors.imageAlt?.message}>
          <Input {...bind("imageAlt")} />
        </Field>
        <ImagePreview src={imageSrc} alt={imageAlt} />
      </Section>

      <Section title="Pricing" description="Shown only when provided. History can't be entered by hand.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="List price (USD, optional)" error={errors.listPrice?.message}>
            <Input {...bind("listPrice")} inputMode="decimal" placeholder="e.g. 349.99" />
          </Field>
          <Field label="Date added" error={errors.addedAt?.message}>
            <Input type="date" {...bind("addedAt")} />
          </Field>
        </div>
      </Section>

      <Section title="Offers" description="Each store's price and shipping. At least one is required.">
        {offersError && <p className="text-sm font-medium text-danger">{offersError}</p>}
        <ul className="grid gap-4">
          {offers.fields.map((field, i) => {
            const rowErrors = errors.offers?.[i];
            return (
              <li key={field.id} className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto_auto] sm:items-end">
                <Field label="Store" error={rowErrors?.storeId?.message}>
                  <NativeSelect {...bind(`offers.${i}.storeId`)}>
                    <option value="">Choose…</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Price" error={rowErrors?.price?.message}>
                  <Input {...bind(`offers.${i}.price`)} inputMode="decimal" />
                </Field>
                <Field label="Shipping" error={rowErrors?.shipping?.message}>
                  <Input {...bind(`offers.${i}.shipping`)} inputMode="decimal" />
                </Field>
                <div className="flex h-10 items-center gap-2">
                  <Checkbox
                    id={`${id}-stock-${i}`}
                    defaultChecked={field.inStock}
                    onCheckedChange={(v) => setValue(`offers.${i}.inStock`, v === true, { shouldDirty: true })}
                  />
                  <Label htmlFor={`${id}-stock-${i}`} className="font-normal">
                    In stock
                  </Label>
                </div>
                <IconButton
                  label={`Remove offer ${i + 1}`}
                  icon={<Trash2 aria-hidden />}
                  onClick={() => offers.remove(i)}
                  disabled={offers.fields.length === 1}
                />
              </li>
            );
          })}
        </ul>
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => offers.append({ storeId: "", price: "", shipping: "0", inStock: true })}
            disabled={offers.fields.length >= stores.length}
          >
            <Plus aria-hidden />
            Add offer
          </Button>
        </div>
      </Section>

      <Section title="Specifications" description="Use consistent labels (e.g. Weight, Battery) so comparisons line up.">
        {specs.fields.length === 0 && <p className="text-sm text-ink-muted">No specifications yet.</p>}
        <ul className="grid gap-3">
          {specs.fields.map((field, i) => (
            <li key={field.id} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-3">
              <Field label="Label" error={errors.specs?.[i]?.label?.message} className="[&_label]:sr-only">
                <Input {...bind(`specs.${i}.label`)} placeholder="Label" />
              </Field>
              <Field label="Value" error={errors.specs?.[i]?.value?.message} className="[&_label]:sr-only">
                <Input {...bind(`specs.${i}.value`)} placeholder="Value" />
              </Field>
              <IconButton label={`Remove specification ${i + 1}`} icon={<Trash2 aria-hidden />} onClick={() => specs.remove(i)} />
            </li>
          ))}
        </ul>
        <div>
          <Button variant="secondary" size="sm" onClick={() => specs.append({ label: "", value: "" })}>
            <Plus aria-hidden />
            Add specification
          </Button>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-paper/90 px-4 py-4 backdrop-blur-md sm:mx-0 sm:px-0">
        {isDirty && <p className="mr-auto text-sm text-ink-muted">Unsaved changes</p>}
        <Button asChild variant="ghost">
          <Link href="/admin/products">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
