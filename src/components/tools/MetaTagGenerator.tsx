/**
 * MetaTagGenerator - Enterprise-Grade Security Component
 * 
 * SECURITY FEATURES:
 * - HTTPS-only URL enforcement (prevents mixed content, MITM attacks)
 * - Multi-layer XSS prevention (sanitization + encoding)
 * - Control character filtering
 * - Dangerous protocol blocking (javascript:, data:, file:, vbscript:)
 * - Strict input validation with whitelists
 * - Length limits to prevent DoS
 * - Real-time validation feedback
 * - Safe output rendering (React JSX auto-escaping)
 * 
 * IMPORTANT SECURITY NOTES:
 * 1. Generated HTML files are downloaded as text/plain to prevent execution
 * 2. If serving these files from a backend, use Content-Disposition: attachment
 * 3. Never serve generated meta tags as HTML without server-side revalidation
 * 4. If implementing server-side image fetching (validation/proxy):
 *    - Use allowlist for domains
 *    - Implement DNS resolution restrictions
 *    - Set request timeouts (prevent slowloris)
 *    - Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
 *    - Disable redirect following to private IPs (SSRF prevention)
 *    - Validate content-type headers
 * 5. All validation happens client-side; implement server-side revalidation for production
 * 
 * @module MetaTagGenerator
 * @security enterprise-level
 * @version 2.0.0
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";
import { notify } from "@/lib/notify";
import { sanitizeText, sanitizeUrl, truncateText, encodeMetaTag, SEO_LIMITS } from "@/lib/security";

// Enterprise-level validation constants
// These limits prevent DoS attacks via excessive input and ensure SEO best practices
const VALIDATION_LIMITS = {
  TITLE_MAX: 70,
  DESCRIPTION_MAX: 200,
  KEYWORDS_MAX: 500,
  AUTHOR_MAX: 100,
  SITE_NAME_MAX: 100,
  IMAGE_ALT_MAX: 200,
  OG_IMAGE_URL_MAX: 2048,
  OG_URL_MAX: 2048,
  CANONICAL_URL_MAX: 2048,
  TWITTER_HANDLE_MAX: 15,
  IMAGE_WIDTH_MAX: 8192,
  IMAGE_HEIGHT_MAX: 8192,
} as const;

// Whitelisted OG types (as per Open Graph protocol)
const ALLOWED_OG_TYPES = [
  'website', 'article', 'book', 'profile', 'music.song', 'music.album',
  'music.playlist', 'music.radio_station', 'video.movie', 'video.episode',
  'video.tv_show', 'video.other'
] as const;

// Whitelisted Twitter card types
const ALLOWED_TWITTER_CARDS = [
  'summary', 'summary_large_image', 'app', 'player'
] as const;

// Whitelisted locales (OG format uses underscore: en_US)
// Must match EXACTLY what the Select component provides
const ALLOWED_LOCALES = [
  'en_US', 'en_GB', 'es_ES', 'es_MX', 'fr_FR', 'de_DE',
  'it_IT', 'pt_BR', 'pt_PT', 'ru_RU', 'ja_JP',
  'ko_KR', 'zh_CN', 'zh_TW', 'ar_SA', 'nl_NL',
  'pl_PL', 'tr_TR', 'sv_SE', 'nb_NO', 'da_DK',
  'fi_FI', 'cs_CZ', 'el_GR', 'he_IL', 'hi_IN',
  'th_TH', 'vi_VN', 'id_ID', 'ms_MY', 'uk_UA'
] as const;

// Field validation errors interface
interface ValidationErrors {
  [key: string]: string | null;
}

export const MetaTagGenerator = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keywords: "",
    author: "",
    robots: "index, follow",
    language: "en",
    charset: "UTF-8",
    viewport: "width=device-width, initial-scale=1.0",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogUrl: "",
    ogType: "website",
    ogSiteName: "",
    ogImageAlt: "",
    ogImageWidth: "",
    ogImageHeight: "",
    ogLocale: "en_US",
    twitterCard: "summary_large_image",
    twitterSite: "",
    twitterCreator: "",
    canonicalUrl: "",
    themeColor: "#000000"
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * Enterprise-level URL validation
   * Enforces HTTPS, prevents XSS vectors, control characters, and data URLs
   * Single source of truth: uses sanitizeUrl with httpsOnly flag
   */
  const validateSecureUrl = (url: string, fieldName: string, required: boolean = false): string | null => {
    if (!url.trim()) {
      return required ? `${fieldName} is required` : null;
    }

    // Check for control characters and dangerous patterns BEFORE URL parsing
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(url)) {
      return `${fieldName} contains invalid control characters`;
    }

    // Single source of truth: sanitizeUrl with httpsOnly=true
    // This checks for dangerous protocols AND enforces HTTPS in one call
    const sanitized = sanitizeUrl(url, true);
    if (!sanitized) {
      return `${fieldName} must be a valid HTTPS URL (http:// and dangerous protocols are not allowed)`;
    }

    // Check URL length
    const maxLength = VALIDATION_LIMITS.OG_IMAGE_URL_MAX;
    if (sanitized.length > maxLength) {
      return `${fieldName} must be less than ${maxLength} characters`;
    }

    return null;
  };

  /**
   * Validate text fields with length limits and content checks
   */
  const validateTextField = (
    text: string,
    fieldName: string,
    maxLength: number,
    required: boolean = false
  ): string | null => {
    if (!text.trim()) {
      return required ? `${fieldName} is required` : null;
    }

    // Check for control characters (excluding normal whitespace)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
      return `${fieldName} contains invalid control characters`;
    }

    if (text.length > maxLength) {
      return `${fieldName} must be less than ${maxLength} characters`;
    }

    return null;
  };

  /**
   * Validate Twitter handle format
   */
  const validateTwitterHandle = (handle: string, fieldName: string): string | null => {
    if (!handle.trim()) return null;

    const cleanHandle = handle.trim();
    
    // Must start with @
    if (!cleanHandle.startsWith('@')) {
      return `${fieldName} must start with @`;
    }

    // Remove @ for validation
    const username = cleanHandle.substring(1);

    // Twitter username rules: 1-15 characters, alphanumeric and underscore only
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return `${fieldName} must be @username with 1-15 alphanumeric characters or underscores`;
    }

    return null;
  };

  /**
   * Validate numeric dimension values
   * Handles edge cases: NaN, Infinity, extremely large integers
   */
  const validateDimension = (value: string, fieldName: string): string | null => {
    if (!value.trim()) return null;

    const num = parseInt(value, 10);
    
    // Comprehensive numeric validation
    if (isNaN(num) || !isFinite(num) || num < 1) {
      return `${fieldName} must be a positive number`;
    }

    // Check for JavaScript's safe integer limit (2^53 - 1)
    if (num > Number.MAX_SAFE_INTEGER) {
      return `${fieldName} exceeds maximum safe integer value`;
    }

    const max = fieldName.includes('Width') ? VALIDATION_LIMITS.IMAGE_WIDTH_MAX : VALIDATION_LIMITS.IMAGE_HEIGHT_MAX;
    if (num > max) {
      return `${fieldName} must be less than ${max}px`;
    }

    return null;
  };

  /**
   * Validate color hex format
   */
  const validateColor = (color: string): string | null => {
    if (!color.trim()) return null;
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return 'Theme color must be a valid hex color (#RRGGBB)';
    }
    return null;
  };

  /**
   * Validate all form fields and return errors
   */
  const validateAllFields = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Basic meta tags
    errors.title = validateTextField(formData.title, 'Title', VALIDATION_LIMITS.TITLE_MAX, true);
    errors.description = validateTextField(formData.description, 'Description', VALIDATION_LIMITS.DESCRIPTION_MAX);
    errors.keywords = validateTextField(formData.keywords, 'Keywords', VALIDATION_LIMITS.KEYWORDS_MAX);
    errors.author = validateTextField(formData.author, 'Author', VALIDATION_LIMITS.AUTHOR_MAX);

    // Open Graph tags
    errors.ogTitle = validateTextField(formData.ogTitle, 'OG Title', VALIDATION_LIMITS.TITLE_MAX);
    errors.ogDescription = validateTextField(formData.ogDescription, 'OG Description', VALIDATION_LIMITS.DESCRIPTION_MAX);
    errors.ogSiteName = validateTextField(formData.ogSiteName, 'OG Site Name', VALIDATION_LIMITS.SITE_NAME_MAX);
    errors.ogImageAlt = validateTextField(formData.ogImageAlt, 'OG Image Alt Text', VALIDATION_LIMITS.IMAGE_ALT_MAX);
    
    // URL validations (HTTPS enforced)
    errors.ogImage = validateSecureUrl(formData.ogImage, 'OG Image URL');
    errors.ogUrl = validateSecureUrl(formData.ogUrl, 'OG URL');
    errors.canonicalUrl = validateSecureUrl(formData.canonicalUrl, 'Canonical URL');

    // Dimension validations
    errors.ogImageWidth = validateDimension(formData.ogImageWidth, 'OG Image Width');
    errors.ogImageHeight = validateDimension(formData.ogImageHeight, 'OG Image Height');

    // Twitter validations
    errors.twitterSite = validateTwitterHandle(formData.twitterSite, 'Twitter Site');
    errors.twitterCreator = validateTwitterHandle(formData.twitterCreator, 'Twitter Creator');

    // Color validation
    errors.themeColor = validateColor(formData.themeColor);

    // OG Type validation
    if (!(ALLOWED_OG_TYPES as readonly string[]).includes(formData.ogType)) {
      errors.ogType = 'Invalid Open Graph type selected';
    }

    // Twitter Card validation
    if (!(ALLOWED_TWITTER_CARDS as readonly string[]).includes(formData.twitterCard)) {
      errors.twitterCard = 'Invalid Twitter Card type selected';
    }

    // Locale validation
    if (!(ALLOWED_LOCALES as readonly string[]).includes(formData.ogLocale)) {
      errors.ogLocale = 'Invalid locale selected';
    }

    // Filter out null errors
    Object.keys(errors).forEach(key => {
      if (errors[key] === null) {
        delete errors[key];
      }
    });

    return errors;
  };

  /**
   * Check if form is valid (no errors)
   */
  const isFormValid = useMemo(() => {
    const errors = validateAllFields();
    return Object.keys(errors).length === 0 && formData.title.trim().length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  /**
   * Handle input change with real-time validation
   * Note: We don't trim here to preserve user intent during typing
   * Trimming happens during validation and generation
   */
  const handleInputChange = (field: string, value: string) => {
    // Early size guard: prevent excessive input (DoS prevention)
    // Allow slightly more than limits for better UX (truncation happens on submit)
    const maxAllowedLength = 10000; // 10KB max for any single field
    if (value.length > maxAllowedLength) {
      notify.error(`Input too large. Maximum ${maxAllowedLength} characters allowed.`);
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /**
   * Generate meta tags with enterprise-level security
   * All inputs are validated, sanitized, and properly escaped
   */
  const generateMetaTags = () => {
    // Validate all fields before generation
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      // Don't generate if there are validation errors
      return '<!-- Meta tags cannot be generated: please fix validation errors above -->';
    }

    const {
      title, description, keywords, author, robots, language, charset, viewport,
      ogTitle, ogDescription, ogImage, ogUrl, ogType, ogSiteName, ogImageAlt,
      ogImageWidth, ogImageHeight, ogLocale,
      twitterCard, twitterSite, twitterCreator,
      canonicalUrl, themeColor
    } = formData;

    // Sanitize and enforce strict character limits with encoding
    const safeTitle = encodeMetaTag(truncateText(title.trim(), VALIDATION_LIMITS.TITLE_MAX));
    const safeDescription = description.trim() 
      ? encodeMetaTag(truncateText(description.trim(), VALIDATION_LIMITS.DESCRIPTION_MAX))
      : '';
    const safeKeywords = keywords.trim()
      ? encodeMetaTag(truncateText(keywords.trim(), VALIDATION_LIMITS.KEYWORDS_MAX))
      : '';
    const safeAuthor = author.trim()
      ? encodeMetaTag(truncateText(author.trim(), VALIDATION_LIMITS.AUTHOR_MAX))
      : '';
    
    // Open Graph tags with strict limits
    const safeOgTitle = (ogTitle.trim() || title.trim())
      ? encodeMetaTag(truncateText((ogTitle.trim() || title.trim()), VALIDATION_LIMITS.TITLE_MAX))
      : '';
    const safeOgDescription = (ogDescription.trim() || description.trim())
      ? encodeMetaTag(truncateText((ogDescription.trim() || description.trim()), VALIDATION_LIMITS.DESCRIPTION_MAX))
      : '';
    const safeOgSiteName = ogSiteName.trim()
      ? encodeMetaTag(truncateText(ogSiteName.trim(), VALIDATION_LIMITS.SITE_NAME_MAX))
      : '';
    const safeOgImageAlt = ogImageAlt.trim()
      ? encodeMetaTag(truncateText(ogImageAlt.trim(), VALIDATION_LIMITS.IMAGE_ALT_MAX))
      : '';

    // Validate and sanitize URLs - HTTPS ENFORCED
    const safeOgImage = ogImage.trim() ? (sanitizeUrl(ogImage.trim(), true) || '') : '';
    const safeOgUrl = ogUrl.trim() ? (sanitizeUrl(ogUrl.trim(), true) || '') : '';
    const safeCanonicalUrl = canonicalUrl.trim() ? (sanitizeUrl(canonicalUrl.trim(), true) || '') : '';

    // Twitter handles
    const safeTwitterSite = twitterSite.trim()
      ? encodeMetaTag(twitterSite.trim())
      : '';
    const safeTwitterCreator = twitterCreator.trim()
      ? encodeMetaTag(twitterCreator.trim())
      : '';

    // Encode fixed/select values (even from dropdowns, for defense in depth)
    const safeLang = encodeMetaTag(language);
    const safeCharset = encodeMetaTag(charset);
    const safeViewport = encodeMetaTag(viewport);
    const safeRobots = encodeMetaTag(robots);
    const safeOgType = encodeMetaTag(ogType);
    const safeTwitterCard = encodeMetaTag(twitterCard);
    const safeThemeColor = encodeMetaTag(themeColor);
    const safeOgLocale = encodeMetaTag(ogLocale);

    // Image dimensions (validated as positive integers)
    const safeImageWidth = ogImageWidth.trim() ? parseInt(ogImageWidth.trim(), 10) : null;
    const safeImageHeight = ogImageHeight.trim() ? parseInt(ogImageHeight.trim(), 10) : null;

    // Build meta tags with proper encoding
    let metaTags = `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
    <meta charset="${safeCharset}">
    <meta name="viewport" content="${safeViewport}">
    <title>${safeTitle}</title>`;

    if (safeDescription) {
      metaTags += `\n    <meta name="description" content="${safeDescription}">`;
    }

    if (safeKeywords) {
      metaTags += `\n    <meta name="keywords" content="${safeKeywords}">`;
    }

    if (safeAuthor) {
      metaTags += `\n    <meta name="author" content="${safeAuthor}">`;
    }

    metaTags += `\n    <meta name="robots" content="${safeRobots}">`;

    if (themeColor) {
      metaTags += `\n    <meta name="theme-color" content="${safeThemeColor}">`;
    }

    // Open Graph tags (all properly validated and encoded)
    if (safeOgTitle) {
      metaTags += `\n    <meta property="og:title" content="${safeOgTitle}">`;
    }

    if (safeOgDescription) {
      metaTags += `\n    <meta property="og:description" content="${safeOgDescription}">`;
    }

    if (safeOgSiteName) {
      metaTags += `\n    <meta property="og:site_name" content="${safeOgSiteName}">`;
    }

    if (safeOgImage) {
      metaTags += `\n    <meta property="og:image" content="${encodeMetaTag(safeOgImage)}">`;
      
      if (safeImageWidth && safeImageWidth > 0) {
        metaTags += `\n    <meta property="og:image:width" content="${safeImageWidth}">`;
      }
      
      if (safeImageHeight && safeImageHeight > 0) {
        metaTags += `\n    <meta property="og:image:height" content="${safeImageHeight}">`;
      }

      if (safeOgImageAlt) {
        metaTags += `\n    <meta property="og:image:alt" content="${safeOgImageAlt}">`;
      }
    }

    if (safeOgUrl) {
      metaTags += `\n    <meta property="og:url" content="${encodeMetaTag(safeOgUrl)}">`;
    }

    metaTags += `\n    <meta property="og:type" content="${safeOgType}">`;
    metaTags += `\n    <meta property="og:locale" content="${safeOgLocale}">`;

    // Twitter Card tags
    metaTags += `\n    <meta name="twitter:card" content="${safeTwitterCard}">`;

    if (safeTwitterSite) {
      metaTags += `\n    <meta name="twitter:site" content="${safeTwitterSite}">`;
    }

    if (safeTwitterCreator) {
      metaTags += `\n    <meta name="twitter:creator" content="${safeTwitterCreator}">`;
    }

    if (safeOgTitle) {
      metaTags += `\n    <meta name="twitter:title" content="${safeOgTitle}">`;
    }

    if (safeOgDescription) {
      metaTags += `\n    <meta name="twitter:description" content="${safeOgDescription}">`;
    }

    if (safeOgImage) {
      metaTags += `\n    <meta name="twitter:image" content="${encodeMetaTag(safeOgImage)}">`;
      
      if (safeOgImageAlt) {
        metaTags += `\n    <meta name="twitter:image:alt" content="${safeOgImageAlt}">`;
      }
    }

    // Canonical URL
    if (safeCanonicalUrl) {
      metaTags += `\n    <link rel="canonical" href="${encodeMetaTag(safeCanonicalUrl)}">`;
    }

    metaTags += `\n</head>
<body>
    <!-- Your content here -->
</body>
</html>`;

    return metaTags;
  };

  /**
   * Copy to clipboard with validation
   */
  const copyToClipboard = async () => {
    // Validate before copying
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error("Please fix validation errors before copying");
      return;
    }

    try {
      const metaTags = generateMetaTags();
      
      // Modern approach - works on most browsers including mobile
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(metaTags);
        notify.success("Meta tags copied to clipboard!");
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement("textarea");
        textArea.value = metaTags;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            notify.success("Meta tags copied to clipboard!");
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

  /**
   * Download meta tags with validation
   * Uses text/plain to prevent accidental HTML execution
   */
  const downloadMetaTags = () => {
    // Validate before downloading
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error("Please fix validation errors before downloading");
      return;
    }

    try {
      const metaTags = generateMetaTags();
      
      // Use text/plain to prevent HTML execution when opened in browser
      const blob = new Blob([metaTags], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meta-tags.html';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      notify.success("Meta tags downloaded!");
    } catch (err) {
      console.error('Failed to download: ', err);
      notify.error("Failed to download meta tags!");
    }
  };

  /**
   * Clear all form data and validation errors
   */
  const clearAll = () => {
    setFormData({
      title: "",
      description: "",
      keywords: "",
      author: "",
      robots: "index, follow",
      language: "en",
      charset: "UTF-8",
      viewport: "width=device-width, initial-scale=1.0",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogUrl: "",
      ogType: "website",
      ogSiteName: "",
      ogImageAlt: "",
      ogImageWidth: "",
      ogImageHeight: "",
      ogLocale: "en_US",
      twitterCard: "summary_large_image",
      twitterSite: "",
      twitterCreator: "",
      canonicalUrl: "",
      themeColor: "#000000"
    });
    setValidationErrors({});
    notify.success("Form cleared!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta Tag Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                placeholder="Enter page title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={validationErrors.title ? 'border-red-500' : ''}
                aria-required="true"
                aria-invalid={!!validationErrors.title}
                aria-describedby={validationErrors.title ? "title-error" : "title-hint"}
              />
              {validationErrors.title && (
                <p id="title-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {validationErrors.title}
                </p>
              )}
              <p id="title-hint" className="text-xs text-muted-foreground">
                {formData.title.length}/{VALIDATION_LIMITS.TITLE_MAX} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Enter meta description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className={validationErrors.description ? 'border-red-500' : ''}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/{VALIDATION_LIMITS.DESCRIPTION_MAX} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="keyword1, keyword2, keyword3"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                className={validationErrors.keywords ? 'border-red-500' : ''}
              />
              {validationErrors.keywords && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.keywords}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Author name"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                className={validationErrors.author ? 'border-red-500' : ''}
              />
              {validationErrors.author && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.author}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="robots">Robots</Label>
              <Select value={formData.robots} onValueChange={(value) => handleInputChange('robots', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select robots directive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">Index, Follow</SelectItem>
                  <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                  <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                  <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Open Graph Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="og-title">OG Title</Label>
                <Input
                  id="og-title"
                  placeholder="Open Graph title"
                  value={formData.ogTitle}
                  onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                  className={validationErrors.ogTitle ? 'border-red-500' : ''}
                />
                {validationErrors.ogTitle && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogTitle}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-description">OG Description</Label>
                <Textarea
                  id="og-description"
                  placeholder="Open Graph description"
                  value={formData.ogDescription}
                  onChange={(e) => handleInputChange('ogDescription', e.target.value)}
                  rows={2}
                  className={validationErrors.ogDescription ? 'border-red-500' : ''}
                />
                {validationErrors.ogDescription && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogDescription}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-site-name">OG Site Name</Label>
                <Input
                  id="og-site-name"
                  placeholder="Your Site Name"
                  value={formData.ogSiteName}
                  onChange={(e) => handleInputChange('ogSiteName', e.target.value)}
                  className={validationErrors.ogSiteName ? 'border-red-500' : ''}
                />
                {validationErrors.ogSiteName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogSiteName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-locale">OG Locale</Label>
                <Select value={formData.ogLocale} onValueChange={(value) => handleInputChange('ogLocale', value)}>
                  <SelectTrigger className={validationErrors.ogLocale ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select locale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="en_GB">English (GB)</SelectItem>
                    <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                    <SelectItem value="es_MX">Spanish (Mexico)</SelectItem>
                    <SelectItem value="fr_FR">French</SelectItem>
                    <SelectItem value="de_DE">German</SelectItem>
                    <SelectItem value="it_IT">Italian</SelectItem>
                    <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                    <SelectItem value="pt_PT">Portuguese (Portugal)</SelectItem>
                    <SelectItem value="ja_JP">Japanese</SelectItem>
                    <SelectItem value="ko_KR">Korean</SelectItem>
                    <SelectItem value="zh_CN">Chinese (Simplified)</SelectItem>
                    <SelectItem value="zh_TW">Chinese (Traditional)</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.ogLocale && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogLocale}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">OG Image URL (HTTPS Required)</Label>
                <Input
                  id="og-image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.ogImage}
                  onChange={(e) => handleInputChange('ogImage', e.target.value)}
                  className={validationErrors.ogImage ? 'border-red-500' : ''}
                />
                {validationErrors.ogImage && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image-alt">OG Image Alt Text</Label>
                <Input
                  id="og-image-alt"
                  placeholder="Description of the image"
                  value={formData.ogImageAlt}
                  onChange={(e) => handleInputChange('ogImageAlt', e.target.value)}
                  className={validationErrors.ogImageAlt ? 'border-red-500' : ''}
                />
                {validationErrors.ogImageAlt && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageAlt}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image-width">OG Image Width (px)</Label>
                <Input
                  id="og-image-width"
                  type="number"
                  placeholder="1200"
                  value={formData.ogImageWidth}
                  onChange={(e) => handleInputChange('ogImageWidth', e.target.value)}
                  className={validationErrors.ogImageWidth ? 'border-red-500' : ''}
                />
                {validationErrors.ogImageWidth && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageWidth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image-height">OG Image Height (px)</Label>
                <Input
                  id="og-image-height"
                  type="number"
                  placeholder="630"
                  value={formData.ogImageHeight}
                  onChange={(e) => handleInputChange('ogImageHeight', e.target.value)}
                  className={validationErrors.ogImageHeight ? 'border-red-500' : ''}
                />
                {validationErrors.ogImageHeight && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageHeight}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-url">OG URL (HTTPS Required)</Label>
                <Input
                  id="og-url"
                  placeholder="https://example.com/page"
                  value={formData.ogUrl}
                  onChange={(e) => handleInputChange('ogUrl', e.target.value)}
                  className={validationErrors.ogUrl ? 'border-red-500' : ''}
                />
                {validationErrors.ogUrl && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogUrl}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-type">OG Type</Label>
                <Select value={formData.ogType} onValueChange={(value) => handleInputChange('ogType', value)}>
                  <SelectTrigger className={validationErrors.ogType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="music.song">Music - Song</SelectItem>
                    <SelectItem value="music.album">Music - Album</SelectItem>
                    <SelectItem value="video.movie">Video - Movie</SelectItem>
                    <SelectItem value="video.episode">Video - Episode</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.ogType && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogType}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Twitter Card Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Twitter Card Type</Label>
                <Select value={formData.twitterCard} onValueChange={(value) => handleInputChange('twitterCard', value)}>
                  <SelectTrigger className={validationErrors.twitterCard ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.twitterCard && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.twitterCard}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-site">Twitter Site</Label>
                <Input
                  id="twitter-site"
                  placeholder="@yourwebsite"
                  value={formData.twitterSite}
                  onChange={(e) => handleInputChange('twitterSite', e.target.value)}
                  className={validationErrors.twitterSite ? 'border-red-500' : ''}
                />
                {validationErrors.twitterSite && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.twitterSite}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-creator">Twitter Creator</Label>
                <Input
                  id="twitter-creator"
                  placeholder="@yourusername"
                  value={formData.twitterCreator}
                  onChange={(e) => handleInputChange('twitterCreator', e.target.value)}
                  className={validationErrors.twitterCreator ? 'border-red-500' : ''}
                />
                {validationErrors.twitterCreator && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.twitterCreator}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Additional Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="canonical-url">Canonical URL (HTTPS Required)</Label>
                <Input
                  id="canonical-url"
                  placeholder="https://example.com/canonical-page"
                  value={formData.canonicalUrl}
                  onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                  className={validationErrors.canonicalUrl ? 'border-red-500' : ''}
                />
                {validationErrors.canonicalUrl && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.canonicalUrl}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-color">Theme Color</Label>
                <Input
                  id="theme-color"
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => handleInputChange('themeColor', e.target.value)}
                  className={validationErrors.themeColor ? 'border-red-500' : ''}
                />
                {validationErrors.themeColor && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.themeColor}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Validation Status */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Validation Errors</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Please fix {Object.keys(validationErrors).length} error{Object.keys(validationErrors).length > 1 ? 's' : ''} before generating meta tags.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isFormValid && formData.title && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  All fields validated successfully! Ready to generate meta tags.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={copyToClipboard} 
              className="flex-1 w-full sm:w-auto"
              disabled={!isFormValid}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Meta Tags
            </Button>
            <Button 
              onClick={downloadMetaTags} 
              variant="outline" 
              className="w-full sm:w-auto"
              disabled={!isFormValid}
            >
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Meta Tags Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto">
            <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm break-words">
              {/* Text content is safely escaped by React's JSX rendering */}
              {generateMetaTags()}
            </pre>
          </div>
          {!isFormValid && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Fix validation errors to see the generated meta tags
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep title tags between 50-60 characters for optimal display</li>
                <li>• Meta descriptions should be 150-160 characters</li>
                <li>• Use relevant keywords naturally in your content</li>
                <li>• Include Open Graph tags for better social media sharing</li>
                <li>• Set up canonical URLs to avoid duplicate content issues</li>
                <li>• Use descriptive alt text for images (accessibility + SEO)</li>
                <li>• Ensure your site is mobile-friendly with proper viewport meta tag</li>
                <li>• OG images should be 1200x630px for optimal display on social media</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
