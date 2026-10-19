"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { clientApi } from "@/lib/api/client";
import { authResponse, loginSchema, type LoginInput } from "@/lib/auth/forms";

import { PasswordInput } from "./password-input";
import { useAuthSubmit } from "./use-auth-submit";

export function SignInForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const submit = useAuthSubmit<LoginInput>(["email", "password"], setError);

  const login = useMutation({
    mutationFn: (values: LoginInput) => clientApi("/auth/login", authResponse, { method: "POST", body: values }),
    onSuccess: ({ data }) => submit.onSuccess(data.user, `Welcome back, ${data.user.name}`),
    onError: submit.onError,
  });

  return (
    <form onSubmit={handleSubmit((v) => login.mutate(v))} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <FormAlert tone="error" title="Couldn't sign in">
          {errors.root.server.message}
        </FormAlert>
      )}
      <fieldset disabled={login.isPending} className="grid gap-5">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register("password")} />
        </Field>
      </fieldset>
      <Button type="submit" size="lg" disabled={login.isPending}>
        {login.isPending && <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />}
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
