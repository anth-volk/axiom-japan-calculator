import { describe, expect, it } from "vitest";
import {
  displayToYen,
  moneyScale,
  moneyUnit,
  yenToDisplay,
} from "./currency";

describe("localized money inputs", () => {
  it("uses millions for English annual values", () => {
    expect(moneyScale("en", "annual")).toBe(1_000_000);
    expect(moneyUnit("en", "annual")).toBe("million");
    expect(yenToDisplay("3600000", "en", "annual")).toBe("3.6");
    expect(displayToYen("3.6", "en", "annual")).toBe("3600000");
  });

  it("uses ten-thousand yen for Japanese annual values", () => {
    expect(moneyScale("ja", "annual")).toBe(10_000);
    expect(moneyUnit("ja", "annual")).toBe("万円");
    expect(yenToDisplay("3600000", "ja", "annual")).toBe("360");
    expect(displayToYen("360", "ja", "annual")).toBe("3600000");
  });

  it("uses thousand-yen units for monthly values in both languages", () => {
    expect(moneyUnit("en", "monthly")).toBe("thousand");
    expect(moneyUnit("ja", "monthly")).toBe("千円");
    expect(yenToDisplay("300000", "en", "monthly")).toBe("300");
    expect(displayToYen("300", "ja", "monthly")).toBe("300000");
  });
});
