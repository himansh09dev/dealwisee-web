import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CompareButton } from "@/components/product/compare-button";
import { compareList, COMPARE_MAX } from "@/lib/compare";

import { toastSpy } from "./doubles";

describe("comparison limits", () => {
  beforeEach(() => compareList.clear());

  it("holds at most three products and reports when full", () => {
    expect(COMPARE_MAX).toBe(3);
    expect(["a", "b", "c"].map((s) => compareList.add(s))).toEqual(["added", "added", "added"]);
    expect(compareList.add("d")).toBe("full");
    expect(compareList.add("a")).toBe("exists");
  });

  it("restores a removed product to its original position (undo)", () => {
    ["a", "b", "c"].forEach((s) => compareList.add(s));
    const index = compareList.indexOf("b");
    compareList.remove("b");
    compareList.restore("b", index);
    expect(JSON.parse(window.localStorage.getItem("pricepilot:compare:v1") ?? "[]")).toEqual(["c", "b", "a"]);
  });

  it("explains the limit instead of silently ignoring a fourth product", async () => {
    ["a", "b", "c"].forEach((s) => compareList.add(s));
    render(<CompareButton slug="d" productName="Fourth" />);
    await userEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(toastSpy).toHaveBeenCalledWith("Comparison holds up to 3 products", expect.anything());
    expect(screen.getByRole("button", { name: "Compare" })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a product in and out", async () => {
    render(<CompareButton slug="x" productName="X" />);
    await userEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getByRole("button", { name: "In comparison" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "In comparison" }));
    expect(screen.getByRole("button", { name: "Compare" })).toHaveAttribute("aria-pressed", "false");
  });
});
