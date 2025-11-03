import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ArrowUpDown } from "lucide-react";

interface ExchangeRates {
  [key: string]: number;
}

export const CurrencyConverter = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$" },
    { code: "RUB", name: "Russian Ruble", symbol: "₽" },
    { code: "KRW", name: "South Korean Won", symbol: "₩" },
    { code: "MXN", name: "Mexican Peso", symbol: "$" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr" },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
    { code: "DKK", name: "Danish Krone", symbol: "kr" },
    { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  ];

  // Mock exchange rates (in a real app, you'd fetch from an API)
  const mockExchangeRates: ExchangeRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    INR: 74.0,
    BRL: 5.2,
    RUB: 73.0,
    KRW: 1180.0,
    MXN: 20.0,
    SGD: 1.35,
    HKD: 7.8,
    NZD: 1.4,
    SEK: 8.5,
    NOK: 8.8,
    DKK: 6.3,
    PLN: 3.9,
  };

  useEffect(() => {
    // Simulate fetching exchange rates
    setIsLoading(true);
    setTimeout(() => {
      setExchangeRates(mockExchangeRates);
      setLastUpdated(new Date().toLocaleString());
      setIsLoading(false);
    }, 1000);
  }, []);

  const convertCurrency = () => {
    if (!amount || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return;

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return;

    // Convert to USD first, then to target currency
    const usdAmount = amountValue / exchangeRates[fromCurrency];
    const converted = usdAmount * exchangeRates[toCurrency];
    
    setConvertedAmount(converted);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
  };

  const clearAll = () => {
    setAmount("");
    setFromCurrency("USD");
    setToCurrency("EUR");
    setConvertedAmount(null);
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const getCurrencyName = (code: string) => {
    return currencies.find(c => c.code === code)?.name || code;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Currency Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-currency">From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-currency">To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={convertCurrency} disabled={!amount || isLoading} className="flex-1">
              {isLoading ? "Loading..." : "Convert"}
            </Button>
            <Button onClick={swapCurrencies} variant="outline">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {convertedAmount !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-all px-2">
                {getCurrencySymbol(toCurrency)}{convertedAmount.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <p className="text-muted-foreground break-words px-2">
                {amount} {getCurrencyName(fromCurrency)} = {convertedAmount.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} {getCurrencyName(toCurrency)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Exchange Rate</div>
                <div className="font-medium">
                  1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Inverse Rate</div>
                <div className="font-medium">
                  1 {toCurrency} = {(exchangeRates[fromCurrency] / exchangeRates[toCurrency]).toFixed(4)} {fromCurrency}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lastUpdated && (
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Last updated: {lastUpdated}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Currency Conversion Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Exchange rates fluctuate constantly throughout the day</li>
            <li>• Banks and currency exchange services may charge fees</li>
            <li>• Consider using credit cards with no foreign transaction fees when traveling</li>
            <li>• Some currencies have different rates for buying and selling</li>
            <li>• Always check the current rate before making large currency exchanges</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
