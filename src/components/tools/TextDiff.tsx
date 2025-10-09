import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TextDiff = () => {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  const getDiff = () => {
    if (!text1 || !text2) return null;
    
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const differences = [];
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";
      if (line1 !== line2) {
        differences.push({ line: i + 1, old: line1, new: line2 });
      }
    }
    
    return differences;
  };

  const diff = getDiff();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter original text..."
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              className="min-h-[300px] font-mono"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modified Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter modified text..."
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              className="min-h-[300px] font-mono"
            />
          </CardContent>
        </Card>
      </div>

      {diff && diff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Differences Found: {diff.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diff.map((d, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">Line {d.line}</div>
                  <div className="space-y-1 font-mono text-sm">
                    <div className="rounded bg-destructive/10 p-2 text-destructive">- {d.old}</div>
                    <div className="rounded bg-primary/10 p-2 text-primary">+ {d.new}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {diff && diff.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No differences found. The texts are identical!
          </CardContent>
        </Card>
      )}
    </div>
  );
};
