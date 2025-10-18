import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Fuel } from "lucide-react";

export const FuelCostCalculator = () => {
  const [distance, setDistance] = useState("");
  const [fuelEfficiency, setFuelEfficiency] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [unitSystem, setUnitSystem] = useState("metric");

  const dist = parseFloat(distance) || 0;
  const efficiency = parseFloat(fuelEfficiency) || 0;
  const price = parseFloat(fuelPrice) || 0;

  const calculateFuelCost = () => {
    if (dist <= 0 || efficiency <= 0 || price <= 0) {
      return { fuelNeeded: 0, totalCost: 0, costPerKm: 0, costPerMile: 0 };
    }

    let fuelNeeded: number;
    let costPerKm: number;
    let costPerMile: number;

    if (unitSystem === "metric") {
      // Distance in km, efficiency in L/100km
      fuelNeeded = (dist * efficiency) / 100;
      costPerKm = (fuelNeeded * price) / dist;
      costPerMile = costPerKm * 1.609; // Convert to cost per mile
    } else {
      // Distance in miles, efficiency in MPG
      fuelNeeded = dist / efficiency;
      costPerMile = (fuelNeeded * price) / dist;
      costPerKm = costPerMile / 1.609; // Convert to cost per km
    }

    const totalCost = fuelNeeded * price;

    return { fuelNeeded, totalCost, costPerKm, costPerMile };
  };

  const result = calculateFuelCost();

  const clearAll = () => {
    setDistance("");
    setFuelEfficiency("");
    setFuelPrice("");
    setCurrency("USD");
    setUnitSystem("metric");
  };

  const getCurrencySymbol = () => {
    const symbols: { [key: string]: string } = {
      "USD": "$",
      "EUR": "€",
      "GBP": "£",
      "CAD": "C$",
      "AUD": "A$",
      "JPY": "¥",
      "INR": "₹"
    };
    return symbols[currency] || "$";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuel Cost Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-system">Unit System</Label>
            <Select value={unitSystem} onValueChange={setUnitSystem}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (km, L/100km)</SelectItem>
                <SelectItem value="imperial">Imperial (miles, MPG)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">
                Distance ({unitSystem === "metric" ? "km" : "miles"})
              </Label>
              <Input
                id="distance"
                type="number"
                placeholder="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-efficiency">
                Fuel Efficiency ({unitSystem === "metric" ? "L/100km" : "MPG"})
              </Label>
              <Input
                id="fuel-efficiency"
                type="number"
                placeholder="0"
                value={fuelEfficiency}
                onChange={(e) => setFuelEfficiency(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-price">
                Fuel Price ({getCurrencySymbol()}/{unitSystem === "metric" ? "L" : "gallon"})
              </Label>
              <Input
                id="fuel-price"
                type="number"
                placeholder="0"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
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

      {dist > 0 && efficiency > 0 && price > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fuel Cost Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {result.fuelNeeded.toFixed(2)} {unitSystem === "metric" ? "L" : "gal"}
                </div>
                <div className="text-sm text-muted-foreground">Fuel Needed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {getCurrencySymbol()}{result.totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {getCurrencySymbol()}{result.costPerKm.toFixed(3)}
                </div>
                <div className="text-sm text-muted-foreground">Cost per km</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Trip Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">{dist} {unitSystem === "metric" ? "km" : "miles"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">{efficiency} {unitSystem === "metric" ? "L/100km" : "MPG"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Price:</span>
                    <span className="font-medium">{getCurrencySymbol()}{price}/{unitSystem === "metric" ? "L" : "gal"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Needed:</span>
                    <span className="font-medium">{result.fuelNeeded.toFixed(2)} {unitSystem === "metric" ? "L" : "gal"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per km:</span>
                    <span className="font-medium">{getCurrencySymbol()}{result.costPerKm.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per mile:</span>
                    <span className="font-medium">{getCurrencySymbol()}{result.costPerMile.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Trip Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  For a {dist} {unitSystem === "metric" ? "km" : "mile"} trip, you'll need{' '}
                  <strong>{result.fuelNeeded.toFixed(2)} {unitSystem === "metric" ? "liters" : "gallons"}</strong> of fuel.
                </p>
                <p>
                  The total cost will be <strong>{getCurrencySymbol()}{result.totalCost.toFixed(2)}</strong>.
                </p>
                <p>
                  Your fuel cost is <strong>{getCurrencySymbol()}{result.costPerKm.toFixed(3)} per km</strong> or{' '}
                  <strong>{getCurrencySymbol()}{result.costPerMile.toFixed(3)} per mile</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Drive at steady speeds to improve fuel efficiency</li>
            <li>• Remove unnecessary weight from your vehicle</li>
            <li>• Keep your tires properly inflated</li>
            <li>• Use cruise control on highways when possible</li>
            <li>• Avoid aggressive acceleration and braking</li>
            <li>• Plan your route to avoid traffic and construction</li>
            <li>• Regular maintenance helps maintain fuel efficiency</li>
            <li>• Consider carpooling or public transportation for long commutes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
