"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LoaderCircle, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { passwordRules, registerSchema, type RegisterInput } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

import { PasswordInput } from "./password-input";

const fields = ["name", "email", "password", "confirmPassword"] as const;
type FieldName = (typeof fields)[number];
const isField = (key: string): key is FieldName => fields.some((f) => f === key);

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  // Subscribes only this component to the password value for the live checklist.
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: RegisterInput) {
    const result = await registerAction(values);
    if (result.ok) {
      toast("Account created");
      router.push(result.redirectTo);
      return;
    }
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (isField(field) && messages?.[0]) setError(field, { message: messages[0] });
    }
    setError("root.server", { message: result.message });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <FormAlert tone="error" title="Couldn't create your account">
          {errors.root.server.message}
        </FormAlert>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-5">
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
                <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-signal-ink" : "text-ink-muted")}>
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
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
