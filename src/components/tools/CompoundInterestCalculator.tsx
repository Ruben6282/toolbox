import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export const CompoundInterestCalculator = () => {
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnit, setTimeUnit] = useState("years");
  const [compoundingFrequency, setCompoundingFrequency] = useState("annually");
  const [additionalContributions, setAdditionalContributions] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState("monthly");

  const principalAmount = parseFloat(principal) || 0;
  const rate = parseFloat(interestRate) || 0;
  const timeValue = parseFloat(time) || 0;
  const additional = parseFloat(additionalContributions) || 0;

  const calculateCompoundInterest = () => {
    if (principalAmount <= 0 || rate <= 0 || timeValue <= 0) {
      return { finalAmount: 0, totalInterest: 0, totalContributions: 0 };
    }

    const compoundingFreqMap: { [key: string]: number } = {
      "annually": 1,
      "semi-annually": 2,
      "quarterly": 4,
      "monthly": 12,
      "weekly": 52,
      "daily": 365
    };

    const contributionFreqMap: { [key: string]: number } = {
      "annually": 1,
      "semi-annually": 2,
      "quarterly": 4,
      "monthly": 12,
      "weekly": 52,
      "daily": 365
    };

    const n = compoundingFreqMap[compoundingFrequency] || 1;
    const contributionFreq = contributionFreqMap[contributionFrequency] || 12;
    
    // Convert time to years if needed
    let timeInYears = timeValue;
    if (timeUnit === "months") timeInYears = timeValue / 12;
    if (timeUnit === "weeks") timeInYears = timeValue / 52;
    if (timeUnit === "days") timeInYears = timeValue / 365;

    const r = rate / 100;
    const t = timeInYears;
    
    // Calculate compound interest on principal
    const compoundAmount = principalAmount * Math.pow(1 + r / n, n * t);
    
    // Calculate future value of additional contributions
    let contributionAmount = 0;
    if (additional > 0) {
      const contributionRate = r / contributionFreq;
      const contributionPeriods = contributionFreq * t;
      contributionAmount = additional * ((Math.pow(1 + contributionRate, contributionPeriods) - 1) / contributionRate);
    }
    
    const finalAmount = compoundAmount + contributionAmount;
    const totalContributions = principalAmount + (additional * contributionFreq * t);
    const totalInterest = finalAmount - totalContributions;

    return {
      finalAmount,
      totalInterest,
      totalContributions,
      compoundAmount,
      contributionAmount
    };
  };

  const result = calculateCompoundInterest();

  const clearAll = () => {
    setPrincipal("");
    setInterestRate("");
    setTime("");
    setTimeUnit("years");
    setCompoundingFrequency("annually");
    setAdditionalContributions("");
    setContributionFrequency("monthly");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Initial Investment ($)</Label>
              <Input
                id="principal"
                type="number"
                placeholder="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                placeholder="0.00"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time Period</Label>
              <Input
                id="time"
                type="number"
                placeholder="0"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-unit">Time Unit</Label>
              <Select value={timeUnit} onValueChange={setTimeUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compounding">Compounding Frequency</Label>
              <Select value={compoundingFrequency} onValueChange={setCompoundingFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">Additional Contributions ($)</Label>
              <Input
                id="additional"
                type="number"
                placeholder="0"
                value={additionalContributions}
                onChange={(e) => setAdditionalContributions(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution-freq">Contribution Frequency</Label>
              <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {principalAmount > 0 && rate > 0 && timeValue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compound Interest Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 break-all px-2">
                  ${result.finalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Final Amount</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-all px-2">
                  ${result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Interest</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-all px-2">
                  ${result.totalContributions.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Contributions</div>
              </div>
            </div>

              <div className="space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Initial Investment:</span>
                    <span className="font-medium break-all text-right">${principalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Compound Growth:</span>
                    <span className="font-medium break-all text-right">${result.compoundAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                {additional > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Additional Contributions:</span>
                      <span className="font-medium break-all text-right">${(additional * (contributionFrequency === "monthly" ? 12 : contributionFrequency === "weekly" ? 52 : contributionFrequency === "daily" ? 365 : 1) * (timeUnit === "years" ? timeValue : timeUnit === "months" ? timeValue / 12 : timeUnit === "weeks" ? timeValue / 52 : timeValue / 365)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Contribution Growth:</span>
                      <span className="font-medium break-all text-right">${result.contributionAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Key Insights</h4>
              <div className="text-sm space-y-1 break-words">
                <p>• Your money will grow by <strong className="break-all">{((result.finalAmount / result.totalContributions - 1) * 100).toFixed(1)}%</strong> over {timeValue} {timeUnit}</p>
                <p>• Interest earned: <strong className="break-all">${result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></p>
                <p>• Effective annual rate: <strong className="break-all">{((Math.pow(result.finalAmount / result.totalContributions, 1 / (timeUnit === "years" ? timeValue : timeUnit === "months" ? timeValue / 12 : timeUnit === "weeks" ? timeValue / 52 : timeValue / 365)) - 1) * 100).toFixed(2)}%</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compound Interest Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Start investing early - time is your greatest asset</li>
            <li>• Make regular contributions to maximize compound growth</li>
            <li>• Higher compounding frequency leads to slightly better returns</li>
            <li>• Consider tax implications of your investment returns</li>
            <li>• Review and adjust your investment strategy regularly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
