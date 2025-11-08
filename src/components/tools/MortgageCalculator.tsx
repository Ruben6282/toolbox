import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

export const MortgageCalculator = () => {
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const [downPayment, setDownPayment] = useState("");
  const [propertyTax, setPropertyTax] = useState("");
  const [homeInsurance, setHomeInsurance] = useState("");
  const [pmi, setPmi] = useState("");

  const principal = parseFloat(loanAmount) || 0;
  const rate = parseFloat(interestRate) || 0;
  const term = parseInt(loanTerm) || 30;
  const down = parseFloat(downPayment) || 0;
  const tax = parseFloat(propertyTax) || 0;
  const insurance = parseFloat(homeInsurance) || 0;
  const pmiRate = parseFloat(pmi) || 0;

  const calculateMortgage = () => {
    if (principal <= 0 || rate <= 0) return { monthly: 0, total: 0, interest: 0 };

    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;
    
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - principal;
    
    return {
      monthly: monthlyPayment,
      total: totalPayment,
      interest: totalInterest
    };
  };

  const mortgage = calculateMortgage();
  const monthlyTax = tax / 12;
  const monthlyInsurance = insurance / 12;
  const monthlyPmi = (pmiRate / 100 * principal) / 12;
  const totalMonthlyPayment = mortgage.monthly + monthlyTax + monthlyInsurance + monthlyPmi;

  const clearAll = () => {
    setLoanAmount("");
    setInterestRate("");
    setLoanTerm("30");
    setDownPayment("");
    setPropertyTax("");
    setHomeInsurance("");
    setPmi("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount ($)</Label>
              <Input
                id="loan-amount"
                type="number"
                placeholder="0"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                placeholder="0.00"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max="30"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (Years)</Label>
              <Input
                id="loan-term"
                type="number"
                placeholder="30"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment ($)</Label>
              <Input
                id="down-payment"
                type="number"
                placeholder="0"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-tax">Annual Property Tax ($)</Label>
              <Input
                id="property-tax"
                type="number"
                placeholder="0"
                value={propertyTax}
                onChange={(e) => setPropertyTax(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-insurance">Annual Home Insurance ($)</Label>
              <Input
                id="home-insurance"
                type="number"
                placeholder="0"
                value={homeInsurance}
                onChange={(e) => setHomeInsurance(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pmi">PMI Rate (%)</Label>
              <Input
                id="pmi"
                type="number"
                placeholder="0.00"
                value={pmi}
                onChange={(e) => setPmi(e.target.value)}
                min="0"
                max="5"
                step="0.01"
              />
            </div>
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {principal > 0 && rate > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mortgage Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Monthly Payment Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Principal & Interest:</span>
                    <span className="font-medium break-all text-right">${mortgage.monthly.toFixed(2)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Property Tax:</span>
                      <span className="font-medium break-all text-right">${monthlyTax.toFixed(2)}</span>
                    </div>
                  )}
                  {insurance > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Home Insurance:</span>
                      <span className="font-medium break-all text-right">${monthlyInsurance.toFixed(2)}</span>
                    </div>
                  )}
                  {pmiRate > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">PMI:</span>
                      <span className="font-medium break-all text-right">${monthlyPmi.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-xs sm:text-sm gap-2">
                    <span className="font-semibold flex-shrink-0">Total Monthly Payment:</span>
                    <span className="font-bold text-base sm:text-lg break-all text-right">${totalMonthlyPayment.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Loan Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Loan Amount:</span>
                    <span className="font-medium break-all text-right">${principal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Interest Paid:</span>
                    <span className="font-medium break-all text-right">${mortgage.interest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Total Amount Paid:</span>
                    <span className="font-medium break-all text-right">${mortgage.total.toLocaleString()}</span>
                  </div>
                  {down > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground flex-shrink-0">Down Payment:</span>
                      <span className="font-medium break-all text-right">${down.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Key Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Interest Rate:</span>
                  <span className="font-medium">{rate}%</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Loan Term:</span>
                  <span className="font-medium">{term} years</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="text-muted-foreground">Monthly Rate:</span>
                  <span className="font-medium">{(rate / 12).toFixed(3)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mortgage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Consider making extra principal payments to reduce total interest</li>
            <li>• Shop around for the best interest rates and loan terms</li>
            <li>• Factor in closing costs when budgeting for your home purchase</li>
            <li>• PMI is typically required when down payment is less than 20%</li>
            <li>• Property taxes and insurance costs vary by location</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
