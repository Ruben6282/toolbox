import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const LoanCalculator = () => {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("30");

  const calculateLoan = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseFloat(years) * 12;

    if (isNaN(p) || isNaN(r) || isNaN(n)) return null;

    const monthlyPayment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - p;

    return {
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    };
  };

  const result = calculateLoan();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Loan Amount ($)</Label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Annual Interest Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Loan Term (years)</Label>
            <Input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">${result.monthlyPayment}</div>
                <p className="mt-2 text-muted-foreground">per month</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">${result.totalPayment}</div>
                  <p className="mt-1 text-sm text-muted-foreground">over {years} years</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">${result.totalInterest}</div>
                  <p className="mt-1 text-sm text-muted-foreground">interest paid</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
