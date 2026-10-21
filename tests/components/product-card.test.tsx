import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCard } from "@/components/product/product-card";

import { item, json, renderWithQuery, stubApi } from "./helpers";

describe("ProductCard", () => {
  it("shows brand, name, best total, list price and store count, linked to the product", () => {
    stubApi((url) => (url.endsWith("/api/auth/me") ? json(200, { data: { user: null } }) : undefined));
    renderWithQuery(<ProductCard {...item()} />);

    const card = screen.getByRole("article");
    expect(within(card).getByRole("link", { name: "Test Speaker" })).toHaveAttribute("href", "/products/test-speaker");
    expect(card).toHaveTextContent("Acme");
    expect(card).toHaveTextContent("$89.99");
    expect(within(card).getByText(/List price/)).toBeInTheDocument();
    expect(card).toHaveTextContent("Best at Voltmart");
    expect(card).toHaveTextContent("2 stores");
    expect(within(card).getByRole("img", { name: "A black speaker" })).toBeInTheDocument();
  });

  it("explains the price against history only when history exists", () => {
    stubApi((url) => (url.endsWith("/api/auth/me") ? json(200, { data: { user: null } }) : undefined));
    const { unmount } = renderWithQuery(<ProductCard {...item()} />);
    expect(screen.getByText(/versus its recent average price/)).toBeInTheDocument();
    unmount();

    renderWithQuery(<ProductCard {...item({ history: undefined })} />);
    expect(screen.queryByText(/recent average/)).not.toBeInTheDocument();
  });
});
