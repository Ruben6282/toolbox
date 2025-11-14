import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc, formatCurrency } from "@/lib/safe-math";

export const TaxCalculator = () => {
  // New: tax year + dynamic data with safe fallback
  const [taxYear, setTaxYear] = useState<string>("2025");
  interface RemoteYearData {
    federalBrackets: Record<string, Array<{ min: number; max: number; rate: number }>>;
    standardDeductions: Record<string, number>;
  }
  type RemoteTaxData = Record<string, RemoteYearData>;
  const [remoteTaxData, setRemoteTaxData] = useState<RemoteTaxData | null>(null);
  const [isLoadingTaxData, setIsLoadingTaxData] = useState<boolean>(true);

  // Security constants and allowlists
  const ALLOWED_YEARS = useMemo(() => ["2024", "2025"] as const, []);
  const ALLOWED_STATES = useMemo(
    () => [
      "none",
      "california",
      "new-york",
      "texas",
      "florida",
      "illinois",
      "pennsylvania",
      "ohio",
      "georgia",
      "north-carolina",
      "michigan",
    ] as const,
    []
  );

  // Caps to prevent resource exhaustion and UI freezes
  const MAX_SAFE_INPUT = 1e12; // $1,000,000,000,000 upper-bound for any amount
  const MAX_BRACKETS = 20; // prevent maliciously large brackets arrays
  const MAX_STANDARD_DEDUCTION = 1e6; // sanity cap



  const [grossIncome, setGrossIncome] = useState("");
  const [filingStatus, setFilingStatus] = useState("single");
  const [deductions, setDeductions] = useState("");
  const [taxCredits, setTaxCredits] = useState("");
  const [state, setState] = useState("none");
  const [additionalIncome, setAdditionalIncome] = useState("");

  const income = safeNumber(grossIncome, { min: 0, max: MAX_SAFE_INPUT }) || 0;
  const deductionAmount = safeNumber(deductions, { min: 0, max: MAX_SAFE_INPUT }) || 0;
  const credits = safeNumber(taxCredits, { min: 0, max: MAX_SAFE_INPUT }) || 0;
  const additional = safeNumber(additionalIncome, { min: 0, max: MAX_SAFE_INPUT }) || 0;
  const totalIncome = safeCalc(D => D(income).plus(additional)) || 0;

  // Fallback tax data (ensures tool never breaks)
  const fallbackTaxData: Record<string, {
    federalBrackets: Record<string, Array<{ min: number; max: number; rate: number }>>;
    standardDeductions: Record<string, number>;
  }> = {
    "2024": {
      federalBrackets: {
        single: [
          { min: 0, max: 11000, rate: 0.10 },
          { min: 11000, max: 44725, rate: 0.12 },
          { min: 44725, max: 95375, rate: 0.22 },
          { min: 95375, max: 182050, rate: 0.24 },
          { min: 182050, max: 231250, rate: 0.32 },
          { min: 231250, max: 578125, rate: 0.35 },
          { min: 578125, max: Infinity, rate: 0.37 }
        ],
        married: [
          { min: 0, max: 22000, rate: 0.10 },
          { min: 22000, max: 89450, rate: 0.12 },
          { min: 89450, max: 190750, rate: 0.22 },
          { min: 190750, max: 364200, rate: 0.24 },
          { min: 364200, max: 462500, rate: 0.32 },
          { min: 462500, max: 693750, rate: 0.35 },
          { min: 693750, max: Infinity, rate: 0.37 }
        ]
      },
      standardDeductions: {
        single: 13850,
        married: 27700
      }
    },
    // 2025 fallback currently mirrors 2024; remote file can override
    "2025": {
      federalBrackets: {
        single: [
          { min: 0, max: 11000, rate: 0.10 },
          { min: 11000, max: 44725, rate: 0.12 },
          { min: 44725, max: 95375, rate: 0.22 },
          { min: 95375, max: 182050, rate: 0.24 },
          { min: 182050, max: 231250, rate: 0.32 },
          { min: 231250, max: 578125, rate: 0.35 },
          { min: 578125, max: Infinity, rate: 0.37 }
        ],
        married: [
          { min: 0, max: 22000, rate: 0.10 },
          { min: 22000, max: 89450, rate: 0.12 },
          { min: 89450, max: 190750, rate: 0.22 },
          { min: 190750, max: 364200, rate: 0.24 },
          { min: 364200, max: 462500, rate: 0.32 },
          { min: 462500, max: 693750, rate: 0.35 },
          { min: 693750, max: Infinity, rate: 0.37 }
        ]
      },
      standardDeductions: {
        single: 13850,
        married: 27700
      }
    }
  };

  // Try to fetch tax data (served statically from /tax-data.json); always falls back
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Type guards
    const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
    const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

    // Validate and sanitize remote data to prevent misuse/malicious payloads
    const validateAndSanitizeRemoteData = (data: unknown): RemoteTaxData | null => {
      if (!data || typeof data !== "object") return null;
      const out: Record<string, RemoteYearData> = {};
      for (const year of ALLOWED_YEARS) {
        const yd = (data as Record<string, unknown>)[year];
        if (!isRecord(yd)) continue;
        const fbUnknown = yd["federalBrackets"];
        const sdUnknown = yd["standardDeductions"];
        if (!isRecord(fbUnknown) || !isRecord(sdUnknown)) continue;

        const statuses = ["single", "married"] as const;
        const sanitizedBrackets: Record<string, Array<{ min: number; max: number; rate: number }>> = {};
        let valid = true;

        for (const status of statuses) {
          const arrUnknown = fbUnknown[status];
          if (!Array.isArray(arrUnknown)) { valid = false; break; }
          const cleaned: Array<{ min: number; max: number; rate: number }> = [];
          for (const bUnknown of (arrUnknown as unknown[]).slice(0, MAX_BRACKETS)) {
            if (!isRecord(bUnknown)) continue;
            let min = Number(bUnknown.min);
            let max = Number(bUnknown.max);
            const rate = Number(bUnknown.rate);
            if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(rate)) continue;
            if (min < 0) min = 0;
            if (max <= min) continue;
            if (rate < 0 || rate > 1) continue;
            // Cap extremely large values to avoid overflow/slow formatting
            if (max > Number.MAX_SAFE_INTEGER) max = Number.MAX_SAFE_INTEGER;
            cleaned.push({ min, max, rate });
          }
          // Sort by min ascending to preserve logic
          cleaned.sort((a, b) => a.min - b.min);
          if (cleaned.length === 0) { valid = false; break; }
          sanitizedBrackets[status] = cleaned;
        }

        const sanitizedDeductions: Record<string, number> = {};
        for (const status of statuses) {
          const vUnknown = sdUnknown[status];
          const v = Number(vUnknown);
          if (!Number.isFinite(v) || v < 0) { valid = false; break; }
          sanitizedDeductions[status] = Math.min(v, MAX_STANDARD_DEDUCTION);
        }

        if (valid) out[year] = { federalBrackets: sanitizedBrackets, standardDeductions: sanitizedDeductions };
      }
      return Object.keys(out).length ? (out as RemoteTaxData) : null;
    };

    (async () => {
      try {
        setIsLoadingTaxData(true);
        const res = await fetch("/tax-data.json", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load tax data");
        const data = await res.json();
        if (cancelled) return;
        const sanitized = validateAndSanitizeRemoteData(data);
        setRemoteTaxData(sanitized);
      } catch {
        if (!cancelled) setRemoteTaxData(null);
      } finally {
        if (!cancelled) setIsLoadingTaxData(false);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeData = useMemo(() => {
    // Prefer remote data if available and valid
    const yearData = remoteTaxData?.[taxYear];
    if (yearData?.federalBrackets && yearData?.standardDeductions) return yearData;
    // Fall back to baked-in
    return fallbackTaxData[taxYear] ?? fallbackTaxData["2024"];
  // fallbackTaxData is static (object literal), safe to ignore exhaustive dep warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteTaxData, taxYear]);

  const calculateFederalTax = () => {
    const safeFiling = filingStatus === "married" ? "married" : "single";
    const brackets = activeData.federalBrackets[safeFiling] as Array<{ min: number; max: number; rate: number }>;
    const standardDeduction = activeData.standardDeductions[safeFiling] as number;
    const totalDeduction = Math.max(deductionAmount, standardDeduction);
    const taxableIncome = Math.max(0, Math.min((safeCalc(D => D(totalIncome).minus(totalDeduction)) || 0), MAX_SAFE_INPUT));
    
    let tax = 0;
    for (const bracket of brackets.slice(0, MAX_BRACKETS)) {
      if (taxableIncome > bracket.min) {
        const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        if (incomeInBracket > 0) {
          const bracketTax = safeCalc(D => D(incomeInBracket).mul(bracket.rate));
          if (bracketTax !== null) tax += bracketTax;
        }
      } else {
        break;
      }
    }
    
    return { tax, taxableIncome, totalDeduction };
  };

  const calculateStateTax = (taxableIncome: number) => {
    const stateRates: { [key: string]: number } = {
      "none": 0,
      "california": 0.013,
      "new-york": 0.045,
      "texas": 0,
      "florida": 0,
      "illinois": 0.0495,
      "pennsylvania": 0.0307,
      "ohio": 0.0315,
      "georgia": 0.055,
      "north-carolina": 0.0525,
      "michigan": 0.0425
    };
    
    const rate = stateRates[state] || 0;
    return safeCalc(D => D(taxableIncome).mul(rate)) || 0;
  };

  const federalResult = calculateFederalTax();
  const stateTax = calculateStateTax(federalResult.taxableIncome);
  // Apply credits and never let tax go below zero
  const totalTaxCalc = safeCalc(D => D(federalResult.tax).plus(stateTax).minus(credits));
  const totalTax = Math.max(0, totalTaxCalc || 0);
  const netIncome = safeCalc(D => D(totalIncome).minus(totalTax)) || 0;
  const effectiveRate = totalIncome > 0 ? ((safeCalc(D => D(totalTax).div(totalIncome).mul(100)) || 0)) : 0;

  // Currency formatter
  const fmt = (n: number) => formatCurrency(Math.min(Math.max(0, n), MAX_SAFE_INPUT));

  const clearAll = () => {
    setGrossIncome("");
    setFilingStatus("single");
    setDeductions("");
    setTaxCredits("");
    setState("none");
    setAdditionalIncome("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-year">Tax Year</Label>
              <Select value={taxYear} onValueChange={setTaxYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Brackets and deductions load dynamically with baked-in fallback.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gross-income">Gross Annual Income ($)</Label>
              <SafeNumberInput
                id="gross-income"
                placeholder="0"
                value={grossIncome}
                onChange={(sanitized) => setGrossIncome(sanitized)}
                sanitizeOptions={{ min: 0, max: MAX_SAFE_INPUT }}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filing-status">Filing Status</Label>
              <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v === "married" ? "married" : "single")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select filing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married Filing Jointly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Itemized Deductions ($)</Label>
              <SafeNumberInput
                id="deductions"
                placeholder="0"
                value={deductions}
                onChange={(sanitized) => setDeductions(sanitized)}
                sanitizeOptions={{ min: 0, max: MAX_SAFE_INPUT }}
                inputMode="decimal"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use standard deduction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-credits">Tax Credits ($)</Label>
              <SafeNumberInput
                id="tax-credits"
                placeholder="0"
                value={taxCredits}
                onChange={(sanitized) => setTaxCredits(sanitized)}
                sanitizeOptions={{ min: 0, max: MAX_SAFE_INPUT }}
                inputMode="decimal"
              />
              <p className="text-xs text-muted-foreground">Credits directly reduce total tax owed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={(v) => setState((ALLOWED_STATES as readonly string[]).includes(v) ? v : "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No State Tax</SelectItem>
                  <SelectItem value="california">California</SelectItem>
                  <SelectItem value="new-york">New York</SelectItem>
                  <SelectItem value="texas">Texas</SelectItem>
                  <SelectItem value="florida">Florida</SelectItem>
                  <SelectItem value="illinois">Illinois</SelectItem>
                  <SelectItem value="pennsylvania">Pennsylvania</SelectItem>
                  <SelectItem value="ohio">Ohio</SelectItem>
                  <SelectItem value="georgia">Georgia</SelectItem>
                  <SelectItem value="north-carolina">North Carolina</SelectItem>
                  <SelectItem value="michigan">Michigan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-income">Additional Income ($)</Label>
              <SafeNumberInput
                id="additional-income"
                placeholder="0"
                value={additionalIncome}
                onChange={(sanitized) => setAdditionalIncome(sanitized)}
                sanitizeOptions={{ min: 0, max: MAX_SAFE_INPUT }}
                inputMode="decimal"
              />
              <p className="text-xs text-muted-foreground">
                Other income sources (investments, side jobs, etc.)
              </p>
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {totalIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 break-all px-2">
                  {fmt(totalIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Total Income</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 break-all px-2">
                  {fmt(totalTax)}
                </div>
                <div className="text-sm text-muted-foreground">Total Tax</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 break-all px-2">
                  {fmt(netIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Net Income</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Tax Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Federal Tax:</span>
                    <span className="font-medium break-all text-right">{fmt(federalResult.tax)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Tax Credits:</span>
                    <span className="font-medium break-all text-right">-{fmt(credits)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Taxable Income:</span>
                    <span className="font-medium break-all text-right">{fmt(federalResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Deductions Used:</span>
                    <span className="font-medium break-all text-right">{fmt(federalResult.totalDeduction)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">State Tax:</span>
                    <span className="font-medium break-all text-right">{fmt(stateTax)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Effective Tax Rate:</span>
                    <span className="font-medium break-all text-right">{effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tax Summary</h4>
              <div className="text-sm space-y-1 break-words">
                <p>Your effective tax rate is <strong className="break-all">{effectiveRate.toFixed(2)}%</strong>.</p>
                 <p>You'll pay <strong className="break-all">{fmt(totalTax)}</strong> in taxes.</p>
                 <p>Your take-home income will be <strong className="break-all">{fmt(netIncome)}</strong>.</p>
                {credits > 0 && (
                  <p>Tax credits reduce your tax by <strong className="break-all">{fmt(credits)}</strong>.</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Using {remoteTaxData ? "loaded" : "fallback"} {taxYear} tax data.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingTaxData && (
        <div className="text-center text-xs text-muted-foreground italic" aria-live="polite">Loading remote tax data...</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tax Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• This calculator provides estimates based on 2024 tax brackets</li>
            <li>• Consider contributing to retirement accounts to reduce taxable income</li>
            <li>• Itemize deductions if they exceed the standard deduction</li>
            <li>• Take advantage of available tax credits</li>
            <li>• Consult a tax professional for complex situations</li>
            <li>• Tax laws change frequently, so verify current rates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
