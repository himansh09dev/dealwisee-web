"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, LoaderCircle, Minus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { clientApi } from "@/lib/api/client";
import { authResponse, passwordRules, registerFormSchema, type RegisterFormInput } from "@/lib/auth/forms";
import { cn } from "@/lib/utils";

import { PasswordInput } from "./password-input";
import { useAuthSubmit } from "./use-auth-submit";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  // Subscribes only this component to the password value for the live checklist.
  const password = useWatch({ control, name: "password" });
  const submit = useAuthSubmit<RegisterFormInput>(["name", "email", "password"], setError);

  const createAccount = useMutation({
    // confirmPassword never leaves the browser.
    mutationFn: ({ name, email, password }: RegisterFormInput) =>
      clientApi("/auth/register", authResponse, { method: "POST", body: { name, email, password } }),
    onSuccess: ({ data }) => submit.onSuccess(data.user, "Account created"),
    onError: submit.onError,
  });

  return (
    <form onSubmit={handleSubmit((v) => createAccount.mutate(v))} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <FormAlert tone="error" title="Couldn't create your account">
          {errors.root.server.message}
        </FormAlert>
      )}
      <fieldset disabled={createAccount.isPending} className="grid gap-5">
        <Field label="Name" error={errors.name?.message}>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...register("email")} />
        </Field>
        <div className="grid gap-2">
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput autoComplete="new-password" {...register("password")} />
          </Field>
          <ul aria-label="Password requirements" className="grid gap-1 text-xs">
            {passwordRules.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn("flex items-center gap-1.5", met ? "text-signal-ink" : "text-ink-muted")}
                >
                  {met ? <Check aria-hidden className="size-3.5" /> : <Minus aria-hidden className="size-3.5" />}
                  {rule.label}
                  <span className="sr-only">{met ? "(met)" : "(not met yet)"}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register("confirmPassword")} />
        </Field>
      </fieldset>
      <Button type="submit" size="lg" disabled={createAccount.isPending}>
        {createAccount.isPending && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
        {createAccount.isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
