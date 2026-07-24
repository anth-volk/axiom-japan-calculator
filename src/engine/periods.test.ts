import { describe, expect, it } from "vitest";
import { annualPeriod, isSupportedMonth, monthPeriod } from "./periods";

describe("Japan Wave 1 execution periods", () => {
  it("uses the explicit April 1, 2017 inclusive boundary", () => {
    expect(isSupportedMonth("2017-03")).toBe(false);
    expect(isSupportedMonth("2017-04")).toBe(true);
    expect(isSupportedMonth("2017-99")).toBe(false);
    expect(annualPeriod(2017)).toEqual({
      period_kind: "tax_year",
      start: "2017-04-01",
      end: "2017-12-31",
    });
  });

  it("uses complete calendar tax years from 2018", () => {
    expect(annualPeriod(2018)).toEqual({
      period_kind: "tax_year",
      start: "2018-01-01",
      end: "2018-12-31",
    });
  });

  it("creates the correct monthly interval", () => {
    expect(monthPeriod("2024-02")).toEqual({
      period_kind: "month",
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
});
