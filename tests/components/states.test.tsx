import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { WishlistGrid } from "@/app/wishlist/wishlist-grid";

import { item, json, renderWithQuery, shopper, stubApi } from "./helpers";

describe("WishlistGrid states", () => {
  it("shows a loading skeleton, then a sign-in prompt for signed-out visitors", async () => {
    stubApi(() => json(200, { data: { user: null } }));
    renderWithQuery(<WishlistGrid />);
    expect(screen.getByLabelText("Loading wishlist")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", { name: "Sign in to see your wishlist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?next=/wishlist");
  });

  it("shows an error with a working retry", async () => {
    let failures = 1;
    stubApi((url) => {
      if (url.endsWith("/api/auth/me")) return json(200, { data: { user: shopper } });
      if (url.endsWith("/api/wishlist")) {
        if (failures-- > 0) return json(503, { error: { code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable" } });
        return json(200, { data: [item().product] });
      }
      return undefined;
    });
    renderWithQuery(<WishlistGrid />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Your wishlist didn't load");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Test Speaker" })).toBeInTheDocument());
  });

  it("shows an empty state that links back to discovery", async () => {
    stubApi((url) =>
      url.endsWith("/api/auth/me") ? json(200, { data: { user: shopper } }) : json(200, { data: [] }),
    );
    renderWithQuery(<WishlistGrid />);
    expect(await screen.findByRole("heading", { name: "Nothing saved yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discover products" })).toHaveAttribute("href", "/products");
  });
});
