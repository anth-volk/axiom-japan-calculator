import type { Language } from "../i18n/translations";
import {
  formatUsdEquivalent,
  type UsdConversionRate,
} from "../policy/currency";
import { formatYen } from "../policy/format";

interface CurrencyValueProps {
  yen: number;
  language: Language;
  usdRate: UsdConversionRate | null;
  className?: string;
}

export function UsdEquivalent({
  yen,
  language,
  usdRate,
  className,
}: CurrencyValueProps) {
  const equivalent = formatUsdEquivalent(yen, language, usdRate);
  if (!equivalent) return null;
  return (
    <small className={`usd-equivalent${className ? ` ${className}` : ""}`}>
      {equivalent}
    </small>
  );
}

export function CurrencyValue({
  yen,
  language,
  usdRate,
  className,
}: CurrencyValueProps) {
  return (
    <span className={`currency-value${className ? ` ${className}` : ""}`}>
      <span>{formatYen(yen, language)}</span>
      <UsdEquivalent language={language} usdRate={usdRate} yen={yen} />
    </span>
  );
}
