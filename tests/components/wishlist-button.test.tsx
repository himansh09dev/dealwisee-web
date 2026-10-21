import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Profiler } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { WishlistButton } from "@/components/product/wishlist-button";

import { toastSpy } from "./doubles";
import { item, json, renderWithQuery, shopper, stubApi } from "./helpers";

const speaker = item();

/** The heart only acts once the wishlist has loaded (so a failed save can roll back). */
const wishlistLoaded = (client: QueryClient) =>
  waitFor(() => expect(client.getQueryState(["wishlist"])?.status).toBe("success"));
const button = () => screen.getByRole("button", { name: /Save Test Speaker to wishlist/ });

describe("WishlistButton", () => {
  it("asks signed-out visitors to sign in instead of saving", async () => {
    const fetchMock = stubApi((url) => (url.endsWith("/api/auth/me") ? json(200, { data: { user: null } }) : undefined));
    renderWithQuery(<WishlistButton item={speaker} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await userEvent.click(button());
    expect(toastSpy).toHaveBeenCalledWith("Sign in to save products", expect.anything());
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/api/wishlist/"))).toBe(false);
  });

  it("fills the heart immediately, then saves", async () => {
    let saved = false;
    const fetchMock = stubApi((url, init) => {
      if (url.endsWith("/api/auth/me")) return json(200, { data: { user: shopper } });
      if (url.endsWith("/api/wishlist") && (init?.method ?? "GET") === "GET") return json(200, { data: saved ? [speaker.product] : [] });
      if (url.includes("/api/wishlist/") && init?.method === "POST") {
        saved = true;
        return json(201, { data: { productId: speaker.product.id, saved: true } });
      }
      return undefined;
    });
    const { client } = renderWithQuery(<WishlistButton item={speaker} />);
    await wishlistLoaded(client);
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith("/api/wishlist"))).toBe(true);

    await userEvent.click(button());
    expect(button()).toHaveAttribute("aria-pressed", "true"); // optimistic, before the response
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith("Saved to your wishlist", expect.anything()));
    expect(button()).toHaveAttribute("aria-pressed", "true");
  });

  it("rolls back and explains when saving fails", async () => {
    stubApi((url, init) => {
      if (url.endsWith("/api/auth/me")) return json(200, { data: { user: shopper } });
      if (url.endsWith("/api/wishlist") && (init?.method ?? "GET") === "GET") return json(200, { data: [] });
      if (init?.method === "POST")
        return json(409, { error: { code: "CONFLICT", message: "Your wishlist is full (200 products)." } });
      return undefined;
    });
    const { client } = renderWithQuery(<WishlistButton item={speaker} />);
    await wishlistLoaded(client);

    await userEvent.click(button());
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith("Couldn't update your wishlist", {
        description: "Your wishlist is full (200 products).",
      }),
    );
    expect(button()).toHaveAttribute("aria-pressed", "false");
  });

  it("re-renders only the heart whose product changed", async () => {
    const other = item({ id: "fedcba9876543210fedcba98", slug: "other", name: "Other Speaker" });
    stubApi((url, init) => {
      if (url.endsWith("/api/auth/me")) return json(200, { data: { user: shopper } });
      if (url.endsWith("/api/wishlist") && (init?.method ?? "GET") === "GET") return json(200, { data: [] });
      if (init?.method === "POST") return json(201, { data: { productId: speaker.product.id, saved: true } });
      return undefined;
    });
    const renders: Record<string, number> = { a: 0, b: 0 };
    const count = (id: string) => () => {
      renders[id] = (renders[id] ?? 0) + 1;
    };
    const { client } = renderWithQuery(
      <>
        <Profiler id="a" onRender={count("a")}>
          <WishlistButton item={speaker} />
        </Profiler>
        <Profiler id="b" onRender={count("b")}>
          <WishlistButton item={other} />
        </Profiler>
      </>,
    );
    await wishlistLoaded(client);
    await new Promise((r) => setTimeout(r, 50));
    const before = { ...renders };

    await userEvent.click(button());
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    expect(renders.a).toBeGreaterThan(before.a ?? 0);
    expect(renders.b).toBe(before.b); // the other heart didn't re-render
  });
});
