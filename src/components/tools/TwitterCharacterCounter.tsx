import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RotateCcw, Twitter } from "lucide-react";

export const TwitterCharacterCounter = () => {
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const maxLength = 280;
  const currentLength = text.length;
  const remainingChars = maxLength - currentLength;
  const isOverLimit = currentLength > maxLength;
  const isNearLimit = remainingChars <= 20 && remainingChars > 0;

  const getCharacterCountColor = () => {
    if (isOverLimit) return "text-red-600";
    if (isNearLimit) return "text-yellow-600";
    return "text-green-600";
  };

  const getCharacterCountBg = () => {
    if (isOverLimit) return "bg-red-50 border-red-200";
    if (isNearLimit) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearText = () => {
    setText("");
  };

  const getTweetPreview = () => {
    if (!text.trim()) return null;

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Twitter className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">Your Name</span>
              <span className="text-gray-500 text-sm">@yourusername</span>
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-500 text-sm">now</span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{text}</div>
            <div className="flex items-center justify-between mt-3 text-gray-500 text-sm">
              <div className="flex items-center space-x-4">
                <span>💬 Reply</span>
                <span>🔄 Retweet</span>
                <span>❤️ Like</span>
                <span>📤 Share</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Character Count:</span>
                <span className={`font-bold ${getCharacterCountColor()}`}>
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
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Good
                  </Badge>
                )}
              </div>
            </div>

            {remainingChars !== maxLength && (
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  {isOverLimit ? (
                    <span className="text-red-600">
                      {Math.abs(remainingChars)} characters over the limit
                    </span>
                  ) : (
                    <span className={isNearLimit ? "text-yellow-600" : "text-green-600"}>
                      {remainingChars} characters remaining
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} disabled={!text.trim()}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Tweet
            </Button>
            <Button onClick={clearText} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              onClick={() => setShowPreview(!showPreview)} 
              variant="outline"
              disabled={!text.trim()}
            >
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && getTweetPreview()}

      <Card>
        <CardHeader>
          <CardTitle>Twitter Character Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Regular Tweet:</span>
              <span className="font-medium">280 characters</span>
            </div>
            <div className="flex justify-between">
              <span>Twitter Thread:</span>
              <span className="font-medium">280 characters per tweet</span>
            </div>
            <div className="flex justify-between">
              <span>Direct Message:</span>
              <span className="font-medium">10,000 characters</span>
            </div>
            <div className="flex justify-between">
              <span>Bio:</span>
              <span className="font-medium">160 characters</span>
            </div>
            <div className="flex justify-between">
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
