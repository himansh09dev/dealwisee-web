import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RegisterForm } from "@/components/auth/register-form";
import { SignInForm } from "@/components/auth/sign-in-form";

import { router } from "./doubles";
import { json, renderWithQuery, shopper, stubApi } from "./helpers";

describe("SignInForm", () => {
  it("shows field errors, marks fields invalid and focuses the first one", async () => {
    stubApi(() => undefined);
    renderWithQuery(<SignInForm />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const email = screen.getByLabelText("Email");
    expect(await screen.findByText("Enter your email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter your email address");
    expect(email).toHaveFocus();
  });

  it("shows the server's message when credentials are wrong", async () => {
    stubApi((url) =>
      url.endsWith("/api/auth/login")
        ? json(401, { error: { code: "UNAUTHENTICATED", message: "Email or password is incorrect" } })
        : undefined,
    );
    renderWithQuery(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
  });

  it("explains rate limiting in plain words", async () => {
    stubApi(() => json(429, { error: { code: "RATE_LIMITED", message: "Too many attempts." } }));
    renderWithQuery(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please wait a few minutes");
  });

  it("sends admins to the dashboard after signing in", async () => {
    stubApi(() => json(200, { data: { user: { ...shopper, role: "admin" } } }));
    renderWithQuery(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "right-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin/products"));
  });

  it("toggles password visibility with an accessible control", async () => {
    stubApi(() => undefined);
    renderWithQuery(<SignInForm />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });
});

describe("RegisterForm", () => {
  it("updates the password checklist and catches a mismatched confirmation", async () => {
    stubApi(() => undefined);
    renderWithQuery(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Password"), "abcdefghij1");
    const checklist = screen.getByRole("list", { name: "Password requirements" });
    expect(checklist).toHaveTextContent("At least 10 characters(met)");
    expect(checklist).toHaveTextContent("A number(met)");

    await userEvent.type(screen.getByLabelText("Name"), "Ana");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.test");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different-1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  it("puts a duplicate-email error from the API on the email field", async () => {
    stubApi(() =>
      json(409, {
        error: {
          code: "CONFLICT",
          message: "An account with this email already exists",
          details: [{ path: "email", message: "An account with this email already exists" }],
        },
      }),
    );
    renderWithQuery(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Ana");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.test");
    await userEvent.type(screen.getByLabelText("Password"), "abcdefghij1");
    await userEvent.type(screen.getByLabelText("Confirm password"), "abcdefghij1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("An account with this email already exists"),
    );
  });
});
