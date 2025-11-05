import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

interface ExchangeRates {
  [key: string]: number;
}

interface CachedRates {
  base: string;
  rates: ExchangeRates;
  date: string;
  timestamp: number;
}

// 🪙 Default fallback exchange rates
const defaultRates: ExchangeRates = {
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

export const CurrencyConverter = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const getSymbol = (code: string) => currencies.find(c => c.code === code)?.symbol || code;
  const getName = (code: string) => currencies.find(c => c.code === code)?.name || code;

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      const cacheKey = `rates_${fromCurrency}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed: CachedRates = JSON.parse(cachedData);
        const now = Date.now();

        if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setExchangeRates(parsed.rates);
          setLastUpdated(
            new Date(parsed.date).toLocaleString(undefined, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })
          );
          setIsLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`);
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();

        if (data?.rates) {
          setExchangeRates(data.rates);
          setLastUpdated(
            new Date(data.date).toLocaleString(undefined, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })
          );

          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              base: fromCurrency,
              rates: data.rates,
              date: data.date,
              timestamp: Date.now(),
            })
          );
        } else {
          throw new Error("Invalid data");
        }
      } catch {
        console.warn("⚠️ Using fallback exchange rates.");
        toast.warning("Using fallback exchange rates (offline data).");
        
        // Convert defaultRates (which are USD-based) to be relative to fromCurrency
        const baseRate = defaultRates[fromCurrency] || 1;
        const convertedRates: ExchangeRates = {};
        
        Object.keys(defaultRates).forEach(currency => {
          if (currency !== fromCurrency) {
            // Convert from USD to fromCurrency: rate = (toCurrency/USD) / (fromCurrency/USD)
            convertedRates[currency] = defaultRates[currency] / baseRate;
          }
        });
        
        setExchangeRates(convertedRates);

        const fallbackTime = new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        });
        setLastUpdated(`Offline data (updated manually on ${fallbackTime})`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [fromCurrency]);

  const convertedAmount = (() => {
    // Always calculate, even if amount is empty (treat as 0)
    const value = amount ? parseFloat(amount) : 0;
    if (isNaN(value)) return 0;
    if (fromCurrency === toCurrency) return value;
    if (!exchangeRates[toCurrency]) return null; // No rate available
    return value * exchangeRates[toCurrency];
  })();

  const swapCurrencies = () => {
    // Swap both currencies in one go
    const tempFrom = fromCurrency;
    const tempTo = toCurrency;
    setFromCurrency(tempTo);
    setToCurrency(tempFrom);
  };


  const clearAll = () => {
    setAmount("");
    setFromCurrency("USD");
    setToCurrency("EUR");
  };

  const getDisplayAmount = () => {
    return amount || "0";
  };

  const formattedConverted = convertedAmount !== null 
    ? convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    : "0.00";

  return (
    <div className="space-y-6">
      {/* Converter Card */}
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
              step="0.000001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["From", "To"].map((label, i) => {
              const currency = i === 0 ? fromCurrency : toCurrency;
              const setCurrency = i === 0 ? setFromCurrency : setToCurrency;

              return (
                <div key={label} className="space-y-2">
                  <Label>{label}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={swapCurrencies} variant="outline">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button onClick={clearAll} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Result - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Result</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isLoading ? (
            <div className="py-4">
              <div className="text-lg text-muted-foreground mb-2">Loading exchange rates...</div>
              <div className="text-sm text-muted-foreground">Please wait</div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold mb-2">
                {getSymbol(toCurrency)}{formattedConverted}
              </div>
              <p className="text-muted-foreground">
                {getDisplayAmount()} {getName(fromCurrency)} = {formattedConverted} {getName(toCurrency)}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rate Info */}
      {lastUpdated && (
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rate Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Currency Tips */}
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
            <li>• Always check the current rate before making large exchanges</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
