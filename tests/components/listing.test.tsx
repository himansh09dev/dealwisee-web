import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActiveFilters } from "@/components/listing/active-filters";
import { EmptyResults } from "@/components/listing/empty-results";
import { FilterPanel } from "@/components/listing/filter-panel";
import { ListingProvider } from "@/components/listing/listing-context";
import { Pagination } from "@/components/listing/pagination";
import { SearchBox } from "@/components/listing/search-box";
import { defaultQuery, productsHref, type ProductQuery } from "@/lib/catalog/query";

import { router } from "./doubles";

function withListing(ui: ReactNode, query: Partial<ProductQuery> = {}, total = 13) {
  return render(
    <ListingProvider query={{ ...defaultQuery, ...query }} total={total}>
      {ui}
    </ListingProvider>,
  );
}

const lastUrl = () => router.replace.mock.calls.at(-1)?.[0];

describe("SearchBox", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("waits for a 350 ms pause before updating the URL once", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    withListing(<SearchBox />);
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "sony");

    act(() => vi.advanceTimersByTime(300));
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(60));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(lastUrl()).toBe("/products?q=sony");
  });

  it("searches immediately on Enter and keeps other filters", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    withListing(<SearchBox />, { categories: ["audio"], page: 3 });
    await user.type(screen.getByRole("searchbox"), "lamp{Enter}");
    expect(router.replace).toHaveBeenCalledTimes(1);
    // A new search resets to page 1 but keeps the category.
    expect(lastUrl()).toBe("/products?q=lamp&category=audio");
  });
});

describe("FilterPanel", () => {
  const facets = {
    categories: [
      { value: "audio", label: "Audio", count: 2 },
      { value: "gaming", label: "Gaming", count: 0 },
    ],
    brands: [{ value: "Sony", label: "Sony", count: 2 }],
  };

  it("toggles a category into the URL and disables options with no results", async () => {
    withListing(<FilterPanel facets={facets} idPrefix="t" />);
    expect(screen.getByRole("checkbox", { name: /Gaming/ })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /Audio/ }));
    expect(lastUrl()).toBe("/products?category=audio");
  });

  it("applies a price range, swapping min and max when reversed", async () => {
    withListing(<FilterPanel facets={facets} idPrefix="t" />);
    await userEvent.type(screen.getByLabelText("Min"), "500");
    await userEvent.type(screen.getByLabelText("Max"), "100");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(lastUrl()).toBe("/products?min=100&max=500");
  });
});

describe("ActiveFilters", () => {
  const categories = [{ id: "audio", name: "Audio" }];

  it("removes one filter per chip and clears all filters but keeps the sort", async () => {
    withListing(<ActiveFilters categories={categories} />, {
      q: "sony",
      categories: ["audio"],
      brands: ["Sony"],
      sort: "price-asc",
    });
    await userEvent.click(screen.getByRole("button", { name: "Remove filter: Audio" }));
    expect(lastUrl()).toBe("/products?q=sony&brand=Sony&sort=price-asc");

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(lastUrl()).toBe("/products?sort=price-asc");
  });

  it("renders nothing without filters", () => {
    const { container } = withListing(<ActiveFilters categories={categories} />, { sort: "name-asc" });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Pagination", () => {
  const href = (p: number) => productsHref({ ...defaultQuery, sort: "price-asc", page: p });

  it("marks the current page and links neighbours while keeping the sort", () => {
    render(<Pagination page={2} pageCount={5} href={href} />);
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/products?sort=price-asc");
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/products?sort=price-asc&page=3");
  });

  it("disables Previous on the first page and hides itself for a single page", () => {
    const { rerender, container } = render(<Pagination page={1} pageCount={3} href={href} />);
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
    expect(screen.getByText("Previous").closest("[aria-disabled]")).toHaveAttribute("aria-disabled", "true");
    rerender(<Pagination page={1} pageCount={1} href={href} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EmptyResults", () => {
  it("offers to clear filters when a search finds nothing", async () => {
    withListing(<EmptyResults />, { q: "zzzz", categories: ["audio"] }, 0);
    expect(screen.getByRole("heading", { name: "No results for “zzzz”" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(lastUrl()).toBe("/products");
  });
});
