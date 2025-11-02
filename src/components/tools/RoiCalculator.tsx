import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, TrendingUp } from "lucide-react";

export const RoiCalculator = () => {
  const [initialInvestment, setInitialInvestment] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [additionalInvestments, setAdditionalInvestments] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [timeUnit, setTimeUnit] = useState("years");

  const initial = parseFloat(initialInvestment) || 0;
  const final = parseFloat(finalValue) || 0;
  const additional = parseFloat(additionalInvestments) || 0;
  const time = parseFloat(timePeriod) || 0;

  const calculateROI = () => {
    if (initial <= 0 || final <= 0) return { roi: 0, totalReturn: 0, annualizedROI: 0 };

    const totalInvested = initial + additional;
    const totalReturn = final - totalInvested;
    const roi = (totalReturn / totalInvested) * 100;
    
    // Calculate annualized ROI
    let annualizedROI = 0;
    if (time > 0) {
      if (timeUnit === "years") {
        annualizedROI = (Math.pow(final / totalInvested, 1 / time) - 1) * 100;
      } else if (timeUnit === "months") {
        annualizedROI = (Math.pow(final / totalInvested, 12 / time) - 1) * 100;
      } else if (timeUnit === "days") {
        annualizedROI = (Math.pow(final / totalInvested, 365 / time) - 1) * 100;
      }
    }

    return { roi, totalReturn, annualizedROI };
  };

  const result = calculateROI();

  const clearAll = () => {
    setInitialInvestment("");
    setFinalValue("");
    setAdditionalInvestments("");
    setTimePeriod("");
    setTimeUnit("years");
  };

  const getROIColor = (roi: number) => {
    if (roi > 0) return "text-green-600";
    if (roi < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getROIBgColor = (roi: number) => {
    if (roi > 0) return "bg-green-50 border-green-200";
    if (roi < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-investment">Initial Investment ($)</Label>
              <Input
                id="initial-investment"
                type="number"
                placeholder="0"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="final-value">Final Value ($)</Label>
              <Input
                id="final-value"
                type="number"
                placeholder="0"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-investments">Additional Investments ($)</Label>
              <Input
                id="additional-investments"
                type="number"
                placeholder="0"
                value={additionalInvestments}
                onChange={(e) => setAdditionalInvestments(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Any additional money invested during the period
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-period">Time Period</Label>
              <div className="flex gap-2">
                <Input
                  id="time-period"
                  type="number"
                  placeholder="0"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  min="0"
                  className="flex-1"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {initial > 0 && final > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ROI Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 sm:p-6 rounded-lg border ${getROIBgColor(result.roi)}`}>
              <div className="text-center">
                <div className={`text-3xl sm:text-4xl font-bold ${getROIColor(result.roi)} mb-2 break-words`}>
                  {result.roi > 0 ? '+' : ''}{result.roi.toFixed(2)}%
                </div>
                <div className="text-base sm:text-lg font-medium text-muted-foreground">
                  Return on Investment
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 break-words px-2">
                  ${(initial + additional).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Invested</div>
              </div>
              
              <div className="text-center">
                <div className={`text-xl sm:text-2xl font-bold ${getROIColor(result.totalReturn)} break-words px-2`}>
                  {result.totalReturn > 0 ? '+' : ''}${result.totalReturn.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Return</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 break-words px-2">
                  {result.annualizedROI > 0 ? '+' : ''}{result.annualizedROI.toFixed(2)}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Annualized ROI</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Investment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial Investment:</span>
                    <span className="font-medium">${initial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Investments:</span>
                    <span className="font-medium">${additional.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Invested:</span>
                    <span className="font-medium">${(initial + additional).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final Value:</span>
                    <span className="font-medium">${final.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Return:</span>
                    <span className="font-medium">
                      {result.totalReturn > 0 ? '+' : ''}${result.totalReturn.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Period:</span>
                    <span className="font-medium">{time} {timeUnit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Performance Analysis</h4>
              <div className="text-sm space-y-1">
                {result.roi > 0 ? (
                  <p className="text-green-700">
                    ✅ Your investment has generated a <strong>{result.roi.toFixed(2)}%</strong> return.
                  </p>
                ) : result.roi < 0 ? (
                  <p className="text-red-700">
                    ❌ Your investment has lost <strong>{Math.abs(result.roi).toFixed(2)}%</strong> of its value.
                  </p>
                ) : (
                  <p className="text-gray-700">
                    ⚪ Your investment has neither gained nor lost value.
                  </p>
                )}
                
                {time > 0 && (
                  <p>
                    The annualized return is <strong>{result.annualizedROI.toFixed(2)}%</strong> per year.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ROI Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• ROI measures the efficiency of an investment</li>
            <li>• Higher ROI indicates better investment performance</li>
            <li>• Consider the time period when comparing different investments</li>
            <li>• Annualized ROI helps compare investments over different time periods</li>
            <li>• Include all costs and fees in your calculations</li>
            <li>• ROI doesn't account for risk, so consider other factors too</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
