import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Receipt } from "lucide-react";

export const TaxCalculator = () => {
  // New: tax year + dynamic data with safe fallback
  const [taxYear, setTaxYear] = useState<string>("2025");
  interface RemoteYearData {
    federalBrackets: Record<string, Array<{ min: number; max: number; rate: number }>>;
    standardDeductions: Record<string, number>;
  }
  type RemoteTaxData = Record<string, RemoteYearData>;
  const [remoteTaxData, setRemoteTaxData] = useState<RemoteTaxData | null>(null);

  const [grossIncome, setGrossIncome] = useState("");
  const [filingStatus, setFilingStatus] = useState("single");
  const [deductions, setDeductions] = useState("");
  const [taxCredits, setTaxCredits] = useState("");
  const [state, setState] = useState("none");
  const [additionalIncome, setAdditionalIncome] = useState("");

  const clampNonNegative = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const income = clampNonNegative(parseFloat(grossIncome));
  const deductionAmount = clampNonNegative(parseFloat(deductions));
  const credits = clampNonNegative(parseFloat(taxCredits));
  const additional = clampNonNegative(parseFloat(additionalIncome));
  const totalIncome = income + additional;

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
    (async () => {
      try {
        const res = await fetch("/tax-data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load tax data");
        const data = await res.json();
        if (!cancelled) setRemoteTaxData(data);
      } catch {
        if (!cancelled) setRemoteTaxData(null);
      }
    })();
    return () => { cancelled = true; };
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
    const brackets = activeData.federalBrackets[filingStatus] as Array<{ min: number; max: number; rate: number }>;
    const standardDeduction = activeData.standardDeductions[filingStatus] as number;
    const totalDeduction = Math.max(deductionAmount, standardDeduction);
    const taxableIncome = Math.max(0, totalIncome - totalDeduction);
    
    let tax = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        if (incomeInBracket > 0) tax += incomeInBracket * bracket.rate;
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
    return taxableIncome * rate;
  };

  const federalResult = calculateFederalTax();
  const stateTax = calculateStateTax(federalResult.taxableIncome);
  // Apply credits and never let tax go below zero
  const totalTax = Math.max(0, federalResult.tax + stateTax - credits);
  const netIncome = totalIncome - totalTax;
  const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

  // Currency formatter
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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
              <Input
                id="gross-income"
                type="number"
                placeholder="0"
                value={grossIncome}
                onChange={(e) => setGrossIncome(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filing-status">Filing Status</Label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
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
              <Input
                id="deductions"
                type="number"
                placeholder="0"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use standard deduction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-credits">Tax Credits ($)</Label>
              <Input
                id="tax-credits"
                type="number"
                placeholder="0"
                value={taxCredits}
                onChange={(e) => setTaxCredits(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Credits directly reduce total tax owed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={setState}>
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
              <Input
                id="additional-income"
                type="number"
                placeholder="0"
                value={additionalIncome}
                onChange={(e) => setAdditionalIncome(e.target.value)}
                min="0"
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Federal Tax:</span>
                    <span className="font-medium">{fmt(federalResult.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Credits:</span>
                    <span className="font-medium">-{fmt(credits)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Income:</span>
                    <span className="font-medium">{fmt(federalResult.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deductions Used:</span>
                    <span className="font-medium">{fmt(federalResult.totalDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Tax:</span>
                    <span className="font-medium">{fmt(stateTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Tax Rate:</span>
                    <span className="font-medium">{effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tax Summary</h4>
              <div className="text-sm space-y-1">
                <p>Your effective tax rate is <strong>{effectiveRate.toFixed(2)}%</strong>.</p>
                 <p>You'll pay <strong>{fmt(totalTax)}</strong> in taxes.</p>
                 <p>Your take-home income will be <strong>{fmt(netIncome)}</strong>.</p>
                {credits > 0 && (
                  <p>Tax credits reduce your tax by <strong>{fmt(credits)}</strong>.</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Using {remoteTaxData ? "loaded" : "fallback"} {taxYear} tax data.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!remoteTaxData && (
        <div className="text-center text-xs text-muted-foreground italic">Loading remote tax data...</div>
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
