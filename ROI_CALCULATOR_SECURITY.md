## ROI Calculator Security & Validation Overview

### Purpose
Client-side tool to compute simple Return on Investment (ROI) and annualized ROI from user-supplied figures. Provides accessible, sanitized and bounded calculations while deferring authoritative validation to the backend.

### Inputs
| Field | Type | Description | Bounds | Notes |
|-------|------|-------------|--------|-------|
| initialInvestment | number (string to parse) | Starting capital deployed | 0 .. AMOUNT_MAX | Required when finalValue provided; must be > 0 once entered |
| finalValue | number (string) | Ending portfolio / asset value | 0 .. AMOUNT_MAX | Must be > 0 once entered |
| additionalInvestments | number (string) | Extra lump-sum capital added (single aggregate) | 0 .. AMOUNT_MAX | Optional |
| timePeriod | number (string) | Duration amount | 0 .. TIME_YEARS_MAX*(unit multiplier) | Optional; if blank annualized ROI = 0 |
| timeUnit | enum | days | months | years | Whitelist | Required (defaults to years) |

### Sanitization & Validation Steps
1. Trim input strings and reject scientific notation (`/[eE]/`).
2. Use `sanitizeNumber(value, 0, AMOUNT_MAX)` to enforce non-negative bounded amounts; return field-specific error if out-of-range.
3. Convert time to years (days/365, months/12) then enforce upper bound `TIME_YEARS_MAX`.
4. Pristine state: no error shown until either initialInvestment or finalValue is provided.
5. Dependency guard: finalValue cannot be provided without initialInvestment.
6. Must have `totalInvested > 0` before computing ratios.
7. Annualized ROI only computed if `timeYears > 0` and ratio `finalValue/totalInvested > 0`.
8. All derived numbers checked for `Number.isFinite`.

### Formulas
Simple ROI (%): `(finalValue - totalInvested) / totalInvested * 100`.
Annualized ROI (%): `( (finalValue / totalInvested)^(1 / timeYears) - 1 ) * 100` when ratio > 0.
Rounding: monetary & percentage values rounded to 2 decimals.

### Security Considerations
Client-side only: values can be manipulated. Backend MUST:
- Re-validate numeric ranges & types.
- Recompute ROI from canonical stored values.
- Enforce authentication & rate limiting if persistence or analytics involved.
- Implement strong Content-Security-Policy (no unsafe-inline, restrict script origins).
- Consider integrity attributes (subresource integrity) for third-party assets.

### Accessibility Features
- `aria-invalid` and `aria-describedby` for erroneous fields.
- Error banner with `role="alert"` and `aria-live="polite"`.
- Targeted `aria-live` regions for dynamic numerical outputs.
- Clear helper text for bounds and units.

### Edge Cases Handled
- Empty initial load (pristine) -> no error.
- Final without initial -> explicit validation error.
- Zero or negative final value -> error (after user provides it).
- Extremely large numbers -> rejected at sanitize step.
- Time horizon overflow -> capped with explicit error.
- Division by zero prevented via dependency & invested checks.

### Limitations / Non-Goals
- Ignores timing of intermediate cash flows (use IRR/NPV for more accuracy).
- Ignores taxes, fees, slippage, risk adjustments.
- Treats `additionalInvestments` as a single lump sum (not periodic contributions).
- Annualized ROI assumes constant growth; volatile paths not modeled.

### Future Enhancements (Optional)
- Multi-currency support with whitelisted codes.
- Periodic contribution modeling (convert to cashflow series + IRR).
- Telemetry hook for abnormal input patterns.
- Internationalization of labels & error messages.

### Quick Checklist Before Publishing
- [x] Sanitization & bounds enforced.
- [x] Scientific notation rejected.
- [x] Finite guards applied.
- [x] Dependency guard (final requires initial).
- [x] Accessibility attributes present.
- [ ] Automated tests executed in CI (ensure vitest installed and running).
- [ ] Backend revalidation plan documented.

### Test Coverage Recommendations
1. Positive ROI scenario.
2. Negative ROI (loss) scenario.
3. Final without initial -> validation error.
4. Very large value just below AMOUNT_MAX -> success.
5. Out-of-range amount -> error.
6. Time horizon overflow -> error.
7. Annualized ROI correctness for 12 months == 1 year.
8. Scientific notation rejection.

---
This document accompanies the hardened ROI calculator component for public client-side usage.