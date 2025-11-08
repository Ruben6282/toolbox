import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw, Upload, Facebook, Heart, MessageCircle, Share, ThumbsUp } from "lucide-react";
import { notify } from "@/lib/notify";

export const FacebookPostPreview = () => {
  const [postData, setPostData] = useState({
    pageName: "Your Page Name",
    pageAvatar: "",
    postText: "",
    linkUrl: "",
    linkTitle: "",
    linkDescription: "",
    linkImage: "",
    imageUrl: "",
    postType: "text"
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setPostData(prev => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePostHTML = () => {
    const { pageName, pageAvatar, postText, linkUrl, linkTitle, linkDescription, linkImage, imageUrl, postType } = postData;
    
    let html = `<!-- Facebook Post Preview -->\n`;
    html += `<div class="facebook-post" style="max-width: 500px; border: 1px solid #dadde1; border-radius: 8px; background: white; font-family: Helvetica, Arial, sans-serif;">\n`;
    
    // Header
    html += `  <div style="padding: 12px 16px; border-bottom: 1px solid #dadde1;">\n`;
    html += `    <div style="display: flex; align-items: center; gap: 8px;">\n`;
    html += `      <div style="width: 40px; height: 40px; border-radius: 50%; background: #1877f2; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">\n`;
    html += `        ${pageName.charAt(0).toUpperCase()}\n`;
    html += `      </div>\n`;
    html += `      <div>\n`;
    html += `        <div style="font-weight: 600; color: #1c1e21; font-size: 15px;">${pageName}</div>\n`;
    html += `        <div style="color: #65676b; font-size: 13px;">Just now</div>\n`;
    html += `      </div>\n`;
    html += `    </div>\n`;
    html += `  </div>\n`;
    
    // Content
    if (postText) {
      html += `  <div style="padding: 12px 16px; color: #1c1e21; font-size: 15px; line-height: 1.33;">\n`;
      html += `    ${postText.replace(/\n/g, '<br>')}\n`;
      html += `  </div>\n`;
    }
    
    // Media or Link Preview
    if (postType === 'image' && imageUrl) {
      html += `  <div style="border-top: 1px solid #dadde1;">\n`;
      html += `    <img src="${imageUrl}" style="width: 100%; height: auto; display: block;" alt="Post image" />\n`;
      html += `  </div>\n`;
    } else if (postType === 'link' && linkUrl) {
      // Safe URL parsing
      let hostname = 'example.com';
      try {
        hostname = new URL(linkUrl).hostname;
      } catch (e) {
        // If URL is invalid, use placeholder
        hostname = linkUrl || 'example.com';
      }
      
      html += `  <div style="border-top: 1px solid #dadde1; padding: 12px 16px;">\n`;
      html += `    <div style="display: flex; gap: 12px; border: 1px solid #dadde1; border-radius: 8px; overflow: hidden;">\n`;
      if (linkImage) {
        html += `      <div style="width: 120px; height: 120px; background: #f0f2f5; display: flex; align-items: center; justify-content: center;">\n`;
        html += `        <img src="${linkImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="Link preview" />\n`;
        html += `      </div>\n`;
      }
      html += `      <div style="flex: 1; padding: 12px;">\n`;
      html += `        <div style="color: #65676b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">${hostname}</div>\n`;
      if (linkTitle) {
        html += `        <div style="font-weight: 600; color: #1c1e21; font-size: 16px; margin-bottom: 4px;">${linkTitle}</div>\n`;
      }
      if (linkDescription) {
        html += `        <div style="color: #65676b; font-size: 14px; line-height: 1.33;">${linkDescription}</div>\n`;
      }
      html += `      </div>\n`;
      html += `    </div>\n`;
      html += `  </div>\n`;
    }
    
    // Engagement
    html += `  <div style="padding: 8px 16px; border-top: 1px solid #dadde1;">\n`;
    html += `    <div style="display: flex; justify-content: space-between; align-items: center; color: #65676b; font-size: 15px;">\n`;
    html += `      <div style="display: flex; align-items: center; gap: 4px;">\n`;
    html += `        <div style="display: flex; align-items: center; gap: 2px;">\n`;
    html += `          <div style="width: 18px; height: 18px; background: #1877f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">👍</div>\n`;
    html += `          <span>42</span>\n`;
    html += `        </div>\n`;
    html += `      </div>\n`;
    html += `      <div>3 comments • 1 share</div>\n`;
    html += `    </div>\n`;
    html += `  </div>\n`;
    
    // Action buttons
    html += `  <div style="padding: 4px 8px; border-top: 1px solid #dadde1;">\n`;
    html += `    <div style="display: flex; justify-content: space-around;">\n`;
    html += `      <button style="flex: 1; padding: 8px; border: none; background: none; color: #65676b; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;">\n`;
    html += `        👍 Like\n`;
    html += `      </button>\n`;
    html += `      <button style="flex: 1; padding: 8px; border: none; background: none; color: #65676b; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;">\n`;
    html += `        💬 Comment\n`;
    html += `      </button>\n`;
    html += `      <button style="flex: 1; padding: 8px; border: none; background: none; color: #65676b; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;">\n`;
    html += `        🔄 Share\n`;
    html += `      </button>\n`;
    html += `    </div>\n`;
    html += `  </div>\n`;
    
    html += `</div>`;
    
    return html;
  };

  const copyToClipboard = async () => {
    const html = generatePostHTML();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html);
  notify.success("Post HTML copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = html;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Post HTML copied to clipboard!");
          } else {
            notify.error("Failed to copy to clipboard");
          }
        } catch (err) {
          console.error('Fallback: Failed to copy', err);
          notify.error("Failed to copy to clipboard");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
  notify.error("Failed to copy to clipboard");
    }
  };

  const downloadPost = () => {
    const blob = new Blob([generatePostHTML()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facebook-post.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  notify.success("Post HTML downloaded!");
  };

  const clearAll = () => {
    setPostData({
      pageName: "Your Page Name",
      pageAvatar: "",
      postText: "",
      linkUrl: "",
      linkTitle: "",
      linkDescription: "",
      linkImage: "",
      imageUrl: "",
      postType: "text"
    });
    setPreviewImage(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook Post Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="page-name">Page Name</Label>
              <Input
                id="page-name"
                placeholder="Your Page Name"
                value={postData.pageName}
                onChange={(e) => handleInputChange('pageName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-type">Post Type</Label>
              <Select value={postData.postType} onValueChange={(value) => handleInputChange('postType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Post</SelectItem>
                  <SelectItem value="image">Image Post</SelectItem>
                  <SelectItem value="link">Link Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-text">Post Text</Label>
            <Textarea
              id="post-text"
              placeholder="What's on your mind?"
              value={postData.postText}
              onChange={(e) => handleInputChange('postText', e.target.value)}
              rows={4}
            />
          </div>

          {postData.postType === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {postData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={postData.imageUrl}
                    alt="Preview"
                    className="max-w-xs h-auto rounded border"
                  />
                </div>
              )}
            </div>
          )}

          {postData.postType === 'link' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={postData.linkUrl}
                  onChange={(e) => handleInputChange('linkUrl', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-title">Link Title</Label>
                <Input
                  id="link-title"
                  placeholder="Link title"
                  value={postData.linkTitle}
                  onChange={(e) => handleInputChange('linkTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-description">Link Description</Label>
                <Textarea
                  id="link-description"
                  placeholder="Link description"
                  value={postData.linkDescription}
                  onChange={(e) => handleInputChange('linkDescription', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-image">Link Image URL</Label>
                <Input
                  id="link-image"
                  placeholder="https://example.com/image.jpg"
                  value={postData.linkImage}
                  onChange={(e) => handleInputChange('linkImage', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <Button onClick={copyToClipboard} className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Copy className="h-4 w-4" />
              Copy HTML
            </Button>
            <Button onClick={downloadPost} variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-2 sm:p-4 bg-white dark:bg-gray-950">
              <div className="max-w-md mx-auto w-full">
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 font-sans overflow-hidden">
                  {/* Header */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {postData.pageName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm break-words">{postData.pageName}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">Just now</div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {postData.postText && (
                    <div className="p-3 text-gray-900 dark:text-gray-100 text-sm leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">
                      {postData.postText.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  )}

                  {/* Media */}
                  {postData.postType === 'image' && postData.imageUrl && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <img
                        src={postData.imageUrl}
                        alt="Post"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {postData.postType === 'link' && postData.linkUrl && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          {postData.linkImage && (
                            <div className="w-full h-40 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              <img
                                src={postData.linkImage}
                                alt="Link"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-3 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mb-1 break-words">
                              {(() => {
                                try {
                                  return new URL(postData.linkUrl).hostname;
                                } catch (e) {
                                  return postData.linkUrl || 'example.com';
                                }
                              })()}
                            </div>
                            {postData.linkTitle && (
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 break-words overflow-wrap-anywhere">
                                {postData.linkTitle}
                              </div>
                            )}
                            {postData.linkDescription && (
                              <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed break-words overflow-wrap-anywhere">
                                {postData.linkDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Engagement */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">👍</div>
                        <span>42</span>
                      </div>
                      <div className="text-xs sm:text-sm">3 comments • 1 share</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-around">
                      <button className="flex-1 py-2 px-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex items-center justify-center gap-1 sm:gap-2">
                        <span>👍</span>
                        <span className="hidden xs:inline">Like</span>
                      </button>
                      <button className="flex-1 py-2 px-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex items-center justify-center gap-1 sm:gap-2">
                        <span>💬</span>
                        <span className="hidden xs:inline">Comment</span>
                      </button>
                      <button className="flex-1 py-2 px-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex items-center justify-center gap-1 sm:gap-2">
                        <span>🔄</span>
                        <span className="hidden xs:inline">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facebook Post Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep posts engaging with questions or calls-to-action</li>
              <li>• Use high-quality images (1200x630px recommended)</li>
              <li>• Post when your audience is most active</li>
              <li>• Use relevant hashtags (but don't overdo it)</li>
              <li>• Include links to drive traffic to your website</li>
              <li>• Respond to comments to boost engagement</li>
              <li>• Use Facebook's native video for better reach</li>
              <li>• Test different post types to see what works best</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
