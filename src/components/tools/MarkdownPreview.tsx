import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateTextLength, truncateText, MAX_TEXT_LENGTH, sanitizeHtml } from "@/lib/security";
import { notify } from "@/lib/notify";

export const MarkdownPreview = () => {
  const [markdown, setMarkdown] = useState("# Hello World\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2\n\n```javascript\nconst hello = 'world';\n```");

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (!validateTextLength(newText)) {
      notify.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      setMarkdown(truncateText(newText));
      return;
    }
    
    setMarkdown(newText);
  };

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
    
    // Links (with security check)
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, (match, text, url) => {
      // Only allow http, https, and mailto protocols
      if (url.match(/^(https?:\/\/|mailto:|#)/)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return text; // Return just the text if URL is not safe
    });
    
    // Lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Line breaks
    html = html.replace(/\n/gim, '<br>');
    
    // ✅ SECURITY: Use DOMPurify to sanitize the final HTML against XSS attacks
    return sanitizeHtml(html);
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
            onChange={handleMarkdownChange}
            className="min-h-[400px] font-mono"
            maxLength={MAX_TEXT_LENGTH}
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
