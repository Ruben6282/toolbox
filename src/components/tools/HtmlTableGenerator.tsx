import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RotateCcw, Table, Plus, Minus } from "lucide-react";
import { notify } from "@/lib/notify";

export const HtmlTableGenerator = () => {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [tableClass, setTableClass] = useState("");
  const [tableId, setTableId] = useState("");
  const [borderWidth, setBorderWidth] = useState(1);
  const [cellPadding, setCellPadding] = useState(8);
  const [cellSpacing, setCellSpacing] = useState(0);

  // Initialize table data
  const initializeTableData = () => {
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
    setTableData(data);
  };

  const updateTableData = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const generateHTML = () => {
    let html = `<table`;
    
    if (tableId) {
      html += ` id="${tableId}"`;
    }
    
    if (tableClass) {
      html += ` class="${tableClass}"`;
    }
    
  html += ` style="border-collapse: collapse; border-width: ${borderWidth}px; border-style: solid;"`;
    html += `>\n`;

    // Add header row if specified
    if (hasHeader && tableData.length > 0) {
      html += `  <thead>\n    <tr>\n`;
      for (let j = 0; j < columns; j++) {
        html += `      <th style="border-width: ${borderWidth}px; border-style: solid; padding: ${cellPadding}px;">${tableData[0][j] || ''}</th>\n`;
      }
      html += `    </tr>\n  </thead>\n`;
    }

    // Add body rows
    html += `  <tbody>\n`;
    const startRow = hasHeader ? 1 : 0;
    for (let i = startRow; i < rows; i++) {
      html += `    <tr>\n`;
      for (let j = 0; j < columns; j++) {
        const cellContent = tableData[i]?.[j] || '';
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
    if (tableClass) {
      css += `  /* Additional styles for .${tableClass} */\n`;
    }
    css += `}\n\n`;
    
    css += `th, td {\n`;
    css += `  border-width: ${cellSpacing === 0 ? borderWidth : Math.max(1, borderWidth)}px;\n`;
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

    // Dark mode styles
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

      // Fallback for older browsers/mobile
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
  notify.success("Copied to clipboard!");
      } else {
  notify.error("Failed to copy");
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy");
    }
  };

  const clearAll = () => {
    setRows(3);
    setColumns(3);
    setTableData([]);
    setHasHeader(true);
    setTableClass("");
    setTableId("");
    setBorderWidth(1);
    setCellPadding(8);
    setCellSpacing(0);
  };

  // Initialize table data when component mounts or when dimensions change
  useState(() => {
    initializeTableData();
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Table Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rows: {rows}</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setRows(Math.max(1, rows - 1))}
                  size="sm"
                  variant="outline"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                  className="text-center"
                />
                <Button
                  onClick={() => setRows(Math.min(20, rows + 1))}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Columns: {columns}</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setColumns(Math.max(1, columns - 1))}
                  size="sm"
                  variant="outline"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                  className="text-center"
                />
                <Button
                  onClick={() => setColumns(Math.min(20, columns + 1))}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Border Width: {borderWidth}px</Label>
              <Input
                type="range"
                min="0"
                max="5"
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Cell Padding: {cellPadding}px</Label>
              <Input
                type="range"
                min="0"
                max="20"
                value={cellPadding}
                onChange={(e) => setCellPadding(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="has-header">Header Row</Label>
              <Select value={hasHeader.toString()} onValueChange={(value) => setHasHeader(value === "true")}>
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

          <Button onClick={initializeTableData} className="w-full">
            <Table className="h-4 w-4 mr-2" />
            Generate Table
          </Button>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

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
                  borderCollapse: 'collapse',
                  borderWidth: borderWidth,
                  borderStyle: 'solid',
                }}
              >
                {hasHeader && (
                  <thead>
                    <tr>
                      {Array.from({ length: columns }, (_, j) => (
                        <th
                          key={j}
                          className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold"
                          style={{
                            borderWidth: borderWidth,
                            borderStyle: 'solid',
                            padding: `${cellPadding}px`,
                          }}
                        >
                          {tableData[0]?.[j] || ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {Array.from({ length: hasHeader ? rows - 1 : rows }, (_, i) => {
                    const rowIndex = hasHeader ? i + 1 : i;
                    return (
                      <tr key={i}>
                        {Array.from({ length: columns }, (_, j) => (
                          <td
                            key={j}
                            className="border border-gray-300 dark:border-gray-700"
                            style={{
                              borderWidth: borderWidth,
                              borderStyle: 'solid',
                              padding: `${cellPadding}px`
                            }}
                          >
                            {tableData[rowIndex]?.[j] || ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated HTML</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>HTML Code</Label>
              <div className="flex justify-start">
                <Button
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
