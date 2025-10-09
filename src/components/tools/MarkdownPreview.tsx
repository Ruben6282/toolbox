import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MarkdownPreview = () => {
  const [markdown, setMarkdown] = useState("# Hello World\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2\n\n```javascript\nconst hello = 'world';\n```");

  const convertMarkdown = (md: string) => {
    let html = md;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```(.*?)\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
    
    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Line breaks
    html = html.replace(/\n/gim, '<br>');
    
    return html;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter markdown..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="min-h-[400px] font-mono"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: convertMarkdown(markdown) }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
