import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export const TipCalculator = () => {
  const [billAmount, setBillAmount] = useState("");
  const [tipPercentage, setTipPercentage] = useState("15");
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState("1");
  const [useCustomTip, setUseCustomTip] = useState(false);

  const bill = parseFloat(billAmount) || 0;
  const tipPercent = useCustomTip ? parseFloat(customTip) : parseFloat(tipPercentage);
  const numPeople = parseInt(people) || 1;

  const tipAmount = (bill * tipPercent) / 100;
  const totalBill = bill + tipAmount;
  const tipPerPerson = tipAmount / numPeople;
  const totalPerPerson = totalBill / numPeople;

  const clearAll = () => {
    setBillAmount("");
    setTipPercentage("15");
    setCustomTip("");
    setPeople("1");
    setUseCustomTip(false);
  };

  const presetTips = [
    { label: "10%", value: "10" },
    { label: "15%", value: "15" },
    { label: "18%", value: "18" },
    { label: "20%", value: "20" },
    { label: "25%", value: "25" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tip Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-amount">Bill Amount ($)</Label>
            <Input
              id="bill-amount"
              type="number"
              placeholder="0.00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Tip Percentage</Label>
            <div className="flex gap-2">
              <Select 
                value={useCustomTip ? "custom" : tipPercentage} 
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomTip(true);
                  } else {
                    setUseCustomTip(false);
                    setTipPercentage(value);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select tip percentage" />
                </SelectTrigger>
                <SelectContent>
                  {presetTips.map((tip) => (
                    <SelectItem key={tip.value} value={tip.value}>
                      {tip.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {useCustomTip && (
              <Input
                type="number"
                placeholder="Enter custom percentage"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="people">Number of People</Label>
            <Input
              id="people"
              type="number"
              placeholder="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              min="1"
            />
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {bill > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip Amount:</span>
                  <span className="font-medium">${tipAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bill:</span>
                  <span className="font-medium">${totalBill.toFixed(2)}</span>
                </div>
              </div>
              
              {numPeople > 1 && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip per Person:</span>
                    <span className="font-medium">${tipPerPerson.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total per Person:</span>
                    <span className="font-medium">${totalPerPerson.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">
                {numPeople === 1 ? (
                  <>
                    You should tip <strong>${tipAmount.toFixed(2)}</strong> ({tipPercent}% of ${bill.toFixed(2)}), 
                    making your total <strong>${totalBill.toFixed(2)}</strong>.
                  </>
                ) : (
                  <>
                    Each person should pay <strong>${totalPerPerson.toFixed(2)}</strong> 
                    (including <strong>${tipPerPerson.toFixed(2)}</strong> tip each).
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tip Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Restaurants:</strong> 15-20% for good service, 18-25% for excellent service
            </div>
            <div>
              <strong>Delivery:</strong> 10-15% of the order total
            </div>
            <div>
              <strong>Bar/Drinks:</strong> $1-2 per drink or 15-20% of the tab
            </div>
            <div>
              <strong>Hair Salon:</strong> 15-20% of the service cost
            </div>
            <div>
              <strong>Taxi/Rideshare:</strong> 10-15% of the fare
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
