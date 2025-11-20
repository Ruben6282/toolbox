import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RotateCcw, Table, Plus, Minus } from "lucide-react";
import { notify } from "@/lib/notify";

const MIN_ROWS = 1;
const MAX_ROWS = 20;
const MIN_COLS = 1;
const MAX_COLS = 20;

const createInitialTableData = (
  rows: number,
  columns: number,
  hasHeader: boolean
): string[][] => {
  const data: string[][] = [];

  for (let i = 0; i < rows; i++) {
    const row: string[] = [];
    for (let j = 0; j < columns; j++) {
      if (hasHeader && i === 0) {
        row.push(`Header ${j + 1}`);
      } else {
        row.push(`Cell ${i + 1},${j + 1}`);
      }
    }
    data.push(row);
  }

  return data;
};

// Escape attribute values to avoid breaking HTML
const escapeHtmlAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const HtmlTableGenerator = () => {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [tableClass, setTableClass] = useState("");
  const [tableId, setTableId] = useState("");
  const [borderWidth, setBorderWidth] = useState(1);
  const [cellPadding, setCellPadding] = useState(8);
  const [cellSpacing, setCellSpacing] = useState(0); // reserved for future use / CSS
  const [tableData, setTableData] = useState<string[][]>(() =>
    createInitialTableData(3, 3, true)
  );

  const initializeTableData = () => {
    const safeRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows));
    const safeCols = Math.min(MAX_COLS, Math.max(MIN_COLS, columns));
    const data = createInitialTableData(safeRows, safeCols, hasHeader);
    setRows(safeRows);
    setColumns(safeCols);
    setTableData(data);
  };

  const generateHTML = () => {
    const safeRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows));
    const safeCols = Math.min(MAX_COLS, Math.max(MIN_COLS, columns));
    let html = `<table`;

    if (tableId.trim()) {
      html += ` id="${escapeHtmlAttr(tableId.trim())}"`;
    }

    if (tableClass.trim()) {
      html += ` class="${escapeHtmlAttr(tableClass.trim())}"`;
    }

    html += ` style="border-collapse: collapse; border-width: ${borderWidth}px; border-style: solid;"`;
    html += `>\n`;

    // Header row
    if (hasHeader && tableData.length > 0) {
      html += `  <thead>\n    <tr>\n`;
      for (let j = 0; j < safeCols; j++) {
        const content = tableData[0]?.[j] ?? "";
        html += `      <th style="border-width: ${borderWidth}px; border-style: solid; padding: ${cellPadding}px;">${content}</th>\n`;
      }
      html += `    </tr>\n  </thead>\n`;
    }

    // Body rows
    html += `  <tbody>\n`;
    const startRow = hasHeader ? 1 : 0;
    for (let i = startRow; i < safeRows; i++) {
      html += `    <tr>\n`;
      for (let j = 0; j < safeCols; j++) {
        const cellContent = tableData[i]?.[j] ?? "";
        html += `      <td style="border-width: ${borderWidth}px; border-style: solid; padding: ${cellPadding}px;">${cellContent}</td>\n`;
      }
      html += `    </tr>\n`;
    }
    html += `  </tbody>\n`;
    html += `</table>`;

    return html;
  };

  const generateCSS = () => {
    let css = `table {\n`;
    css += `  border-collapse: collapse;\n`;
    css += `  border-width: ${borderWidth}px;\n`;
    css += `  border-style: solid;\n`;
    css += `  border-color: #000;\n`;
    if (tableClass.trim()) {
      css += `  /* Additional styles for .${tableClass.trim()} */\n`;
    }
    css += `}\n\n`;

    css += `th, td {\n`;
    css += `  border-width: ${
      cellSpacing === 0 ? borderWidth : Math.max(1, borderWidth)
    }px;\n`;
    css += `  border-style: solid;\n`;
    css += `  border-color: #000;\n`;
    css += `  padding: ${cellPadding}px;\n`;
    css += `}\n\n`;

    if (hasHeader) {
      css += `th {\n`;
      css += `  background-color: #f3f4f6; /* light gray */\n`;
      css += `  color: #111827; /* nearly black */\n`;
      css += `  font-weight: bold;\n`;
      css += `}\n\n`;
    }

    css += `@media (prefers-color-scheme: dark) {\n`;
    css += `  table {\n`;
    css += `    border-color: #374151; /* gray-700 */\n`;
    css += `    color: #e5e7eb; /* gray-200 text */\n`;
    css += `    background-color: transparent;\n`;
    css += `  }\n`;
    css += `  th, td {\n`;
    css += `    border-color: #374151;\n`;
    css += `  }\n`;
    if (hasHeader) {
      css += `  th {\n`;
      css += `    background-color: #1f2937; /* gray-800 */\n`;
      css += `    color: #f9fafb; /* gray-50 */\n`;
      css += `  }\n`;
    }
    css += `}\n`;

    return css;
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Copied to clipboard!");
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        notify.success("Copied to clipboard!");
      } else {
        notify.error("Failed to copy");
      }
    } catch (err) {
      console.error("Failed to copy: ", err);
      notify.error("Failed to copy");
    }
  };

  const clearAll = () => {
    setRows(3);
    setColumns(3);
    setHasHeader(true);
    setTableClass("");
    setTableId("");
    setBorderWidth(1);
    setCellPadding(8);
    setCellSpacing(0);
    setTableData(createInitialTableData(3, 3, true));
    notify.success("All fields reset!");
  };

  const safeRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows));
  const safeCols = Math.min(MAX_COLS, Math.max(MIN_COLS, columns));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Table Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rows / Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rows: {safeRows}</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setRows((r) => Math.max(MIN_ROWS, r - 1))}
                  size="sm"
                  variant="outline"
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={MIN_ROWS}
                  max={MAX_ROWS}
                  value={rows}
                  onChange={(e) =>
                    setRows(
                      Math.min(
                        MAX_ROWS,
                        Math.max(
                          MIN_ROWS,
                          Number.parseInt(e.target.value, 10) || MIN_ROWS
                        )
                      )
                    )
                  }
                  className="text-center"
                />
                <Button
                  onClick={() => setRows((r) => Math.min(MAX_ROWS, r + 1))}
                  size="sm"
                  variant="outline"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Columns: {safeCols}</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setColumns((c) => Math.max(MIN_COLS, c - 1))}
                  size="sm"
                  variant="outline"
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={MIN_COLS}
                  max={MAX_COLS}
                  value={columns}
                  onChange={(e) =>
                    setColumns(
                      Math.min(
                        MAX_COLS,
                        Math.max(
                          MIN_COLS,
                          Number.parseInt(e.target.value, 10) || MIN_COLS
                        )
                      )
                    )
                  }
                  className="text-center"
                />
                <Button
                  onClick={() => setColumns((c) => Math.min(MAX_COLS, c + 1))}
                  size="sm"
                  variant="outline"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Class / ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table-class">CSS Class</Label>
              <Input
                id="table-class"
                placeholder="my-table"
                value={tableClass}
                onChange={(e) => setTableClass(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-id">Table ID</Label>
              <Input
                id="table-id"
                placeholder="my-table-id"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              />
            </div>
          </div>

          {/* Border / Padding / Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Border Width: {borderWidth}px</Label>
              <Slider
                value={[borderWidth]}
                onValueChange={(v) => setBorderWidth(v[0] ?? 0)}
                min={0}
                max={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Cell Padding: {cellPadding}px</Label>
              <Slider
                value={[cellPadding]}
                onValueChange={(v) => setCellPadding(v[0] ?? 0)}
                min={0}
                max={20}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="has-header">Header Row</Label>
              <Select
                value={hasHeader.toString()}
                onValueChange={(value) => setHasHeader(value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select header option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              initializeTableData();
              notify.success("Table generated!");
            }}
            className="w-full"
          >
            <Table className="h-4 w-4 mr-2" />
            Generate Table
          </Button>

          <Button
            type="button"
            onClick={clearAll}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Table Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table
                className="w-full border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                style={{
                  borderCollapse: "collapse",
                  borderWidth,
                  borderStyle: "solid",
                }}
              >
                {hasHeader && (
                  <thead>
                    <tr>
                      {Array.from({ length: safeCols }, (_, j) => (
                        <th
                          key={j}
                          className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold"
                          style={{
                            borderWidth,
                            borderStyle: "solid",
                            padding: `${cellPadding}px`,
                          }}
                        >
                          {tableData[0]?.[j] ?? ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {Array.from(
                    { length: hasHeader ? safeRows - 1 : safeRows },
                    (_, i) => {
                      const rowIndex = hasHeader ? i + 1 : i;
                      return (
                        <tr key={i}>
                          {Array.from({ length: safeCols }, (_, j) => (
                            <td
                              key={j}
                              className="border border-gray-300 dark:border-gray-700"
                              style={{
                                borderWidth,
                                borderStyle: "solid",
                                padding: `${cellPadding}px`,
                              }}
                            >
                              {tableData[rowIndex]?.[j] ?? ""}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated HTML & CSS */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated HTML & CSS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>HTML Code</Label>
              <div className="flex justify-start">
                <Button
                  type="button"
                  onClick={() => copyToClipboard(generateHTML())}
                  variant="outline"
                  className="mb-2"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy HTML
                </Button>
              </div>
              <Textarea
                value={generateHTML()}
                readOnly
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>CSS Styles</Label>
              <div className="flex justify-start">
                <Button
                  type="button"
                  onClick={() => copyToClipboard(generateCSS())}
                  variant="outline"
                  className="mb-2"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy CSS
                </Button>
              </div>
              <Textarea
                value={generateCSS()}
                readOnly
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>HTML Table Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use semantic HTML with proper table structure (thead, tbody)</li>
            <li>• Add CSS classes for better styling control</li>
            <li>• Consider accessibility with proper table headers</li>
            <li>• Use border-collapse for cleaner borders</li>
            <li>• Add responsive design for mobile devices</li>
            <li>• Consider using CSS Grid or Flexbox for complex layouts</li>
            <li>• Test your table in different browsers</li>
            <li>• Use table headers (th) for better screen reader support</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
