import { describe, expect, it } from "vitest";
import {
  calendarYearEra,
  calendarYearLabel,
  calendarYearMonths,
  calendarYearPeriod,
  isSupportedCalendarYear,
  monthPeriod,
} from "./periods";

describe("Japan Wave 1 calendar years", () => {
  it("uses the explicit April 1, 2017 inclusive boundary", () => {
    expect(isSupportedCalendarYear(2016)).toBe(false);
    expect(isSupportedCalendarYear(2017)).toBe(true);
    expect(calendarYearPeriod(2017)).toEqual({
      period_kind: "tax_year",
      start: "2017-04-01",
      end: "2017-12-31",
    });
    expect(calendarYearMonths(2017)).toEqual([
      "2017-04",
      "2017-05",
      "2017-06",
      "2017-07",
      "2017-08",
      "2017-09",
      "2017-10",
      "2017-11",
      "2017-12",
    ]);
  });

  it("lists January through December for complete years", () => {
    const months = calendarYearMonths(2018);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2018-01");
    expect(months[11]).toBe("2018-12");
  });

  it("labels calendar years in Gregorian and regnal forms", () => {
    expect(calendarYearLabel(2018, "en")).toBe("2018 (Heisei 30)");
    expect(calendarYearLabel(2018, "ja")).toBe("2018年（平成30年）");
    expect(calendarYearEra(2019)).toEqual({
      english: "Heisei 31 / Reiwa 1",
      japanese: "平成31年・令和元年",
    });
    expect(calendarYearLabel(2019, "ja")).toBe(
      "2019年（平成31年・令和元年）",
    );
    expect(calendarYearLabel(2020, "en")).toBe("2020 (Reiwa 2)");
  });

  it("creates the correct monthly interval", () => {
    expect(monthPeriod("2024-02")).toEqual({
      period_kind: "month",
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
});
