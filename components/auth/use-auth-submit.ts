"use client";

import type { PublicUser } from "@pricepilot/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { toast } from "@/components/ui/toaster";
import { isApiError } from "@/lib/api/errors";
import { afterSignInPath, sessionKey } from "@/lib/auth/use-session";

/**
 * Shared success/failure handling for sign-in and registration:
 * - success: cache the user, refetch personal data, go where afterSignInPath says
 * - 400: put the API's field messages on the matching inputs
 * - anything else: one form-level message the user can act on
 */
export function useAuthSubmit<T extends FieldValues>(fields: readonly Path<T>[], setError: UseFormSetError<T>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  return {
    onSuccess(user: PublicUser, message: string) {
      queryClient.setQueryData(sessionKey, user);
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast(message);
      router.replace(afterSignInPath(user.role, { next: searchParams.get("next"), from: searchParams.get("from") }));
      router.refresh();
    },
    onError(err: unknown) {
      if (isApiError(err)) {
        for (const issue of err.details) {
          const field = fields.find((f) => f === issue.path);
          if (field) setError(field, { message: issue.message });
        }
        const message =
          err.code === "RATE_LIMITED"
            ? "Too many attempts. Please wait a few minutes and try again."
            : err.code === "VALIDATION_ERROR"
              ? "Please fix the highlighted fields."
              : err.message;
        setError("root.server", { message });
        return;
      }
      setError("root.server", { message: "Something went wrong. Please try again." });
    },
  };
}
