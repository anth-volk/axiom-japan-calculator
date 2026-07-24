export interface ExecutionPeriod {
  period_kind: "month" | "tax_year";
  start: string;
  end: string;
}

export function monthPeriod(month: string): ExecutionPeriod {
  const [year, rawMonth] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, rawMonth, 0)).getUTCDate();
  return {
    period_kind: "month",
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function annualPeriod(year: number): ExecutionPeriod {
  return {
    period_kind: "tax_year",
    start: year === 2017 ? "2017-04-01" : `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function isSupportedMonth(month: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return false;
  const monthNumber = Number(match[2]);
  return (
    monthNumber >= 1 &&
    monthNumber <= 12 &&
    month >= "2017-04" &&
    month <= "2026-12"
  );
}
