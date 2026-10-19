"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { signInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { signInSchema, type SignInInput } from "@/lib/auth/schemas";

import { PasswordInput } from "./password-input";

export function SignInForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    const result = await signInAction(values);
    if (result.ok) {
      toast("Signed in");
      router.push(result.redirectTo);
      return;
    }
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if ((field === "email" || field === "password") && messages?.[0]) {
        setError(field, { message: messages[0] });
      }
    }
    setError("root.server", { message: result.message });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <FormAlert tone="error" title="Couldn't sign in">
          {errors.root.server.message}
        </FormAlert>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-5">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register("password")} />
        </Field>
      </fieldset>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
