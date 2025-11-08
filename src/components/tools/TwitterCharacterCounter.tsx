import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Twitter } from "lucide-react";
import { notify } from "@/lib/notify";

export const TwitterCharacterCounter = () => {
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const maxLength = 280;
  const currentLength = text.length;
  const remainingChars = maxLength - currentLength;
  const isOverLimit = currentLength > maxLength;
  const isNearLimit = remainingChars <= 20 && remainingChars > 0;

  const getCharacterCountColor = () => {
    if (isOverLimit) return "text-red-600 dark:text-red-400";
    if (isNearLimit) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getCharacterCountBg = () => {
    if (isOverLimit) return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    if (isNearLimit) return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
  };

  const copyToClipboard = async () => {
    try {
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        notify.success("Tweet copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Tweet copied to clipboard!");
          } else {
            notify.error("Failed to copy!");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard!");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      notify.error("Failed to copy to clipboard!");
    }
  };

  const clearText = () => {
    setText("");
    notify.success("Text cleared!");
  };

  const getTweetPreview = () => {
    if (!text.trim()) return null;

    return (
      <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Twitter className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <span className="font-semibold text-xs sm:text-sm break-words">Your Name</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm break-words">@yourusername</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">now</span>
            </div>
            <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{text}</div>
            <div className="flex items-center justify-between mt-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="whitespace-nowrap">💬 Reply</span>
                <span className="whitespace-nowrap">🔄 Retweet</span>
                <span className="whitespace-nowrap">❤️ Like</span>
                <span className="whitespace-nowrap">📤 Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Twitter Character Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tweet-text">Tweet Text</Label>
            <Textarea
              id="tweet-text"
              placeholder="What's happening?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

            <div className={`p-3 rounded-lg border ${getCharacterCountBg()}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Character Count:</span>
                <span className={`font-bold text-xl sm:text-2xl md:text-3xl break-all ${getCharacterCountColor()}`}>
                  {currentLength}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {maxLength}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {isOverLimit && (
                  <Badge variant="destructive">Over Limit</Badge>
                )}
                {isNearLimit && !isOverLimit && (
                  <Badge variant="secondary">Near Limit</Badge>
                )}
                {!isOverLimit && !isNearLimit && (
                  <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                    Good
                  </Badge>
                )}
              </div>
            </div>

            {remainingChars !== maxLength && (
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  {isOverLimit ? (
                    <span className="text-red-600 dark:text-red-400">
                      {Math.abs(remainingChars)} characters over the limit
                    </span>
                  ) : (
                    <span className={isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>
                      {remainingChars} characters remaining
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyToClipboard} disabled={!text.trim()} className="w-full sm:w-auto">
              <Copy className="h-4 w-4 mr-2" />
              Copy Tweet
            </Button>
            <Button onClick={clearText} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              onClick={() => setShowPreview(!showPreview)} 
              variant="outline"
              disabled={!text.trim()}
              className="w-full sm:w-auto"
            >
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <div className="space-y-3">
          {/* ensure preview content wraps nicely on small screens */}
          {getTweetPreview()}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Twitter Character Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span>Regular Tweet:</span>
              <span className="font-medium">280 characters</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Twitter Thread:</span>
              <span className="font-medium">280 characters per tweet</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Direct Message:</span>
              <span className="font-medium">10,000 characters</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Bio:</span>
              <span className="font-medium">160 characters</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Display Name:</span>
              <span className="font-medium">50 characters</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twitter Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use hashtags strategically (1-2 per tweet for best engagement)</li>
            <li>• Include mentions (@username) to engage with others</li>
            <li>• Ask questions to encourage replies and engagement</li>
            <li>• Use emojis sparingly to add personality without wasting characters</li>
            <li>• Consider breaking long thoughts into Twitter threads</li>
            <li>• Use URL shorteners for links to save character space</li>
            <li>• Leave room for retweets and comments when possible</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
