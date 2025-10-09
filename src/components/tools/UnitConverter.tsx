import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const conversions = {
  length: {
    meter: 1,
    kilometer: 0.001,
    centimeter: 100,
    millimeter: 1000,
    mile: 0.000621371,
    yard: 1.09361,
    foot: 3.28084,
    inch: 39.3701,
  },
  weight: {
    kilogram: 1,
    gram: 1000,
    milligram: 1000000,
    pound: 2.20462,
    ounce: 35.274,
    ton: 0.001,
  },
  temperature: {
    celsius: "base",
    fahrenheit: "special",
    kelvin: "special",
  },
};

export const UnitConverter = () => {
  const [category, setCategory] = useState("length");
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("kilometer");
  const [result, setResult] = useState<number | null>(null);

  const convert = (val: string, from: string, to: string, cat: string) => {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) {
      setResult(null);
      return;
    }

    if (cat === "temperature") {
      let celsius = numVal;
      if (from === "fahrenheit") celsius = (numVal - 32) * 5 / 9;
      if (from === "kelvin") celsius = numVal - 273.15;

      if (to === "celsius") setResult(celsius);
      else if (to === "fahrenheit") setResult(celsius * 9 / 5 + 32);
      else if (to === "kelvin") setResult(celsius + 273.15);
    } else {
      const units = conversions[cat as keyof typeof conversions] as Record<string, number>;
      const baseValue = numVal / units[from];
      setResult(baseValue * units[to]);
    }
  };

  const handleChange = (newVal?: string, newFrom?: string, newTo?: string, newCat?: string) => {
    const v = newVal ?? value;
    const f = newFrom ?? fromUnit;
    const t = newTo ?? toUnit;
    const c = newCat ?? category;
    convert(v, f, t, c);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const units = Object.keys(conversions[newCat as keyof typeof conversions]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    handleChange(undefined, units[0], units[1], newCat);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Unit Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="length">Length</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                handleChange(e.target.value);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromUnit} onValueChange={(v) => { setFromUnit(v); handleChange(undefined, v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category as keyof typeof conversions]).map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toUnit} onValueChange={(v) => { setToUnit(v); handleChange(undefined, undefined, v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category as keyof typeof conversions]).map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{result.toFixed(4)}</div>
              <p className="mt-2 text-muted-foreground">
                {value} {fromUnit} = {result.toFixed(4)} {toUnit}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
