import { describe, expect, it } from "vitest";
import {
  fiscalYearEra,
  fiscalYearLabel,
  fiscalYearMonths,
  fiscalYearPeriod,
  isSupportedFiscalYear,
  monthPeriod,
  taxPeriodForFiscalYear,
} from "./periods";

describe("Japan Wave 1 fiscal years", () => {
  it("uses the explicit April 1, 2017 inclusive boundary", () => {
    expect(isSupportedFiscalYear(2016)).toBe(false);
    expect(isSupportedFiscalYear(2017)).toBe(true);
    expect(fiscalYearPeriod(2017)).toEqual({
      period_kind: "month",
      start: "2017-04-01",
      end: "2018-03-31",
    });
    expect(taxPeriodForFiscalYear(2017)).toEqual({
      period_kind: "tax_year",
      start: "2017-04-01",
      end: "2017-12-31",
    });
  });

  it("lists April through the following March", () => {
    const months = fiscalYearMonths(2018);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2018-04");
    expect(months[11]).toBe("2019-03");
  });

  it("labels fiscal years in Gregorian and regnal forms", () => {
    expect(fiscalYearLabel(2018, "en")).toBe("FY 2018 (Heisei 30)");
    expect(fiscalYearLabel(2018, "ja")).toBe("2018年度（平成30年度）");
    expect(fiscalYearEra(2019)).toEqual({
      english: "Reiwa 1",
      japanese: "令和元年度",
    });
    expect(fiscalYearLabel(2019, "ja")).toBe("2019年度（令和元年度）");
  });

  it("creates the correct monthly interval", () => {
    expect(monthPeriod("2024-02")).toEqual({
      period_kind: "month",
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
});
