import { describe, it, expect } from "vitest";
import { getGrowthStage } from "./growth";

describe("getGrowthStage", () => {
  it("returns stage 1 for 0 days", () => {
    expect(getGrowthStage(0)).toBe(1);
  });

  it("returns stage 2 for 5 days", () => {
    expect(getGrowthStage(5)).toBe(2);
  });

  it("returns stage 5 for 21 days", () => {
    expect(getGrowthStage(21)).toBe(5);
  });
});