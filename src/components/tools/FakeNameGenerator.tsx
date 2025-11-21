import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Copy, RotateCcw, Users, Shuffle, Download } from "lucide-react";

import { notify } from "@/lib/notify";

/* -------------------------------------------------------------
   IMPORT DATA + UTILITIES
------------------------------------------------------------- */
import { COUNTRY_CODES, CountryCode } from "@/data/fake-name/country-codes";
import { countryMeta } from "@/data/fake-name/country-meta";

import { escapeCsv } from "@/data/fake-name/utils/csv";
import { generateProfile } from "@/data/fake-name/generate-profile";
import { GenderFilter, GeneratedName, GENDER_FILTERS } from "@/data/fake-name/types";

/* -------------------------------------------------------------
   CONSTANTS & TYPES
------------------------------------------------------------- */

const MIN_COUNT = 1;
const MAX_COUNT = 50;

/* -------------------------------------------------------------
   HELPERS
------------------------------------------------------------- */

const clampCount = (value: number): number =>
  Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.floor(value || MIN_COUNT)));

const coerceGender = (value: string): GenderFilter =>
  (GENDER_FILTERS as readonly string[]).includes(value)
    ? (value as GenderFilter)
    : "random";

const coerceCountry = (value: string): CountryCode =>
  COUNTRY_CODES.includes(value as CountryCode) ? (value as CountryCode) : "us";

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */

export const FakeNameGenerator = () => {
  const [gender, setGender] = useState<GenderFilter>("random");
  const [country, setCountry] = useState<CountryCode>("us");
  const [countInput, setCountInput] = useState<string>("5");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);

  /* -------------------------------------------------------------
     Generate list
  ------------------------------------------------------------- */
  const generateNames = () => {
    const parsed = parseInt(countInput || "", 10);
    const count = clampCount(isNaN(parsed) ? 5 : parsed);

    const list: GeneratedName[] = Array.from({ length: count }, () =>
      generateProfile(country, gender)
    );

    setGeneratedNames(list);
    setCountInput(String(count));
    notify.success(`${count} names generated!`);
  };

  /* -------------------------------------------------------------
     Copy helpers
  ------------------------------------------------------------- */
  const copyToClipboard = async (text: string, successMsg: string) => {
    if (!text) {
      notify.error("Nothing to copy.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      notify.success(successMsg);
    } catch (err) {
      console.error("Copy failed:", err);
      notify.error("Failed to copy.");
    }
  };

  const copySingleName = (n: GeneratedName) => {
    const text = [
      `${n.firstName} ${n.lastName}`,
      `Gender: ${n.gender}`,
      `Age: ${n.age}`,
      `Birth date: ${n.birthDate}`,
      `Email: ${n.email}`,
      `Username: ${n.username}`,
      `Phone: ${n.phone}`,
      `Address: ${n.address}`,
      `City: ${n.city}`,
      `Postal code: ${n.postalCode}`,
      `Country: ${n.countryName}`,
      `Nationality: ${n.nationality}`,
      `Job: ${n.jobTitle} @ ${n.company}`,
    ].join("\n");

    copyToClipboard(text, "Name copied!");
  };

  const copyAllText = () => {
    if (!generatedNames.length) {
      notify.error("No names to copy.");
      return;
    }

    const text = generatedNames
      .map(
        (n) =>
          `${n.firstName} ${n.lastName} | ${n.gender}, ${n.age} (${n.birthDate}) | ${n.email} | ${n.username} | ${n.phone} | ${n.address} | ${n.city} ${n.postalCode} | ${n.countryName} | ${n.jobTitle} @ ${n.company}`
      )
      .join("\n");

    copyToClipboard(text, "All names copied!");
  };

  /* -------------------------------------------------------------
     CSV + JSON export
  ------------------------------------------------------------- */
  const downloadCSV = () => {
    if (!generatedNames.length) {
      notify.error("No names to export.");
      return;
    }

    const header = [
      "First Name",
      "Last Name",
      "Gender",
      "Age",
      "Birth Date",
      "Email",
      "Username",
      "Phone",
      "Address",
      "City",
      "Postal Code",
      "Country Code",
      "Country Name",
      "Nationality",
      "Job Title",
      "Company",
    ].join(",");

    const rows = generatedNames
      .map((n) =>
        [
          escapeCsv(n.firstName),
          escapeCsv(n.lastName),
          escapeCsv(n.gender),
          escapeCsv(String(n.age)),
          escapeCsv(n.birthDate),
          escapeCsv(n.email),
          escapeCsv(n.username),
          escapeCsv(n.phone),
          escapeCsv(n.address),
          escapeCsv(n.city),
          escapeCsv(n.postalCode),
          escapeCsv(n.countryCode),
          escapeCsv(n.countryName),
          escapeCsv(n.nationality),
          escapeCsv(n.jobTitle),
          escapeCsv(n.company),
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([header + "\n" + rows], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-names.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    notify.success("CSV downloaded!");
  };

  const downloadJSON = () => {
    if (!generatedNames.length) {
      notify.error("No names to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(generatedNames, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fake-names.json";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    notify.success("JSON downloaded!");
  };

  const clearNames = () => setGeneratedNames([]);

  /* -------------------------------------------------------------
     UI
  ------------------------------------------------------------- */
  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Fake Name Generator (Pro)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(value) => setGender(coerceGender(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={country}
                onValueChange={(value) => setCountry(coerceCountry(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {COUNTRY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {countryMeta[code].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <Label>Number of Names</Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={countInput}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    setCountInput("");
                    return;
                  }

                  if (/^\d+$/.test(value)) {
                    const n = clampCount(parseInt(value, 10));
                    setCountInput(String(n));
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={generateNames}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Shuffle className="h-4 w-4" />
              Generate Names
            </Button>

            <Button
              onClick={clearNames}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {generatedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between gap-2">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Generated Names ({generatedNames.length})
              </span>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllText}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJSON}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {generatedNames.map((n, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {n.firstName} {n.lastName}
                        </h3>
                        <Badge variant="outline">{n.gender}</Badge>
                        <Badge variant="outline">Age: {n.age}</Badge>
                        <Badge variant="outline">{n.nationality}</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>Email:</strong> {n.email}
                        </div>
                        <div>
                          <strong>Username:</strong> {n.username}
                        </div>
                        <div>
                          <strong>Phone:</strong> {n.phone}
                        </div>
                        <div>
                          <strong>Birth date:</strong> {n.birthDate}
                        </div>
                        <div>
                          <strong>Job:</strong> {n.jobTitle}
                        </div>
                        <div>
                          <strong>Company:</strong> {n.company}
                        </div>
                        <div>
                          <strong>Address:</strong> {n.address}
                        </div>
                        <div>
                          <strong>City / Postal / Country:</strong>{" "}
                          {n.city}, {n.postalCode}, {n.countryName}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => copySingleName(n)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>

        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• All generated identities are fictional.</p>
          <p>• Use only for testing and demo purposes.</p>
          <p>• Great for seeding databases, QA, and UI demos.</p>
        </CardContent>
      </Card>
    </div>
  );
};
