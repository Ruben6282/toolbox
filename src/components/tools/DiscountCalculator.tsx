import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export const DiscountCalculator = () => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const price = parseFloat(originalPrice) || 0;
  const discount = parseFloat(discountValue) || 0;
  const tax = parseFloat(taxRate) || 0;

  const calculateDiscount = () => {
    if (discountType === "percentage") {
      return (price * discount) / 100;
    } else {
      return discount;
    }
  };

  const discountAmount = calculateDiscount();
  const discountedPrice = price - discountAmount;
  const taxAmount = (discountedPrice * tax) / 100;
  const finalPrice = discountedPrice + taxAmount;
  const savings = price - discountedPrice;

  const clearAll = () => {
    setOriginalPrice("");
    setDiscountType("percentage");
    setDiscountValue("");
    setTaxRate("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discount Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-price">Original Price ($)</Label>
            <Input
              id="original-price"
              type="number"
              placeholder="0.00"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">
                {discountType === "percentage" ? "Discount Percentage (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="discount-value"
                type="number"
                placeholder={discountType === "percentage" ? "0" : "0.00"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step={discountType === "percentage" ? "0.1" : "0.01"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%) (Optional)</Label>
            <Input
              id="tax-rate"
              type="number"
              placeholder="0"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {price > 0 && discountValue && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Original Price:</span>
                <span className="font-medium break-words text-right">${price.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discount Amount:</span>
                <span className="font-medium text-green-600 break-words text-right">-${discountAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xs sm:text-sm gap-2">
                <span className="text-muted-foreground">Discounted Price:</span>
                <span className="font-medium break-words text-right">${discountedPrice.toFixed(2)}</span>
              </div>

              {tax > 0 && (
                <>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">Tax ({tax}%):</span>
                    <span className="font-medium break-words text-right">+${taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2 text-xs sm:text-sm gap-2">
                    <span className="font-semibold">Final Price:</span>
                    <span className="font-bold text-base sm:text-lg break-words text-right">${finalPrice.toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-green-800 font-medium text-xs sm:text-sm">You Save:</span>
                  <span className="text-green-800 font-bold text-base sm:text-lg break-words">${savings.toFixed(2)}</span>
                </div>
                <div className="text-xs sm:text-sm text-green-700 mt-1">
                  {discountType === "percentage" 
                    ? `${discount}% off` 
                    : `${((discountAmount / price) * 100).toFixed(1)}% off`
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Discount Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Compare prices before applying discounts to ensure you're getting the best deal</li>
            <li>• Check if discounts can be combined with other offers</li>
            <li>• Consider shipping costs when calculating final price</li>
            <li>• Some discounts may have minimum purchase requirements</li>
            <li>• Don't forget to factor in taxes and fees</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
