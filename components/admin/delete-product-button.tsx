"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteProductAction } from "@/app/admin/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, IconButton } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { toast } from "@/components/ui/toaster";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.ok) {
        setOpen(false);
        toast(`Deleted ${name}`);
      } else {
        // Keep the dialog open so the outcome is read in context.
        setError(result.message);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <IconButton label={`Delete ${name}`} icon={<Trash2 aria-hidden />} size="sm" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this product?</AlertDialogTitle>
        <AlertDialogDescription>
          &ldquo;{name}&rdquo; and its offers will be removed from the catalog. People who saved it will see it
          disappear from their lists. This can&rsquo;t be undone.
        </AlertDialogDescription>
        {error && (
          <FormAlert tone="error" title="Not deleted" className="mt-4">
            {error}
          </FormAlert>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" disabled={isPending}>
              {error ? "Close" : "Cancel"}
            </Button>
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isPending} className="bg-danger text-surface hover:bg-danger/90">
            {isPending && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
            {isPending ? "Deleting…" : "Delete product"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
