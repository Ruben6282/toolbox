/**
 * MetaTagGenerator - Enterprise-Grade Security Component (Rebuilt)
 *
 * SECURITY FEATURES:
 * - HTTPS-only URL enforcement (sanitizeUrl with httpsOnly=true)
 * - XSS-safe text via encodeMetaTag + React escaping
 * - Control character filtering
 * - Dangerous protocol blocking (javascript:, data:, file:, vbscript:)
 * - Strict input validation with whitelists and length limits
 * - DoS protection via max field length and strict truncation
 *
 * UX CHANGES:
 * - No preview or error on initial load
 * - "Generate Meta Tags" button triggers validation + generation
 * - Preview shown only after successful generation
 * - Global validation errors surfaced via notify() instead of inline preview text
 * - Copy / Download also validate before action
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Download, RotateCcw, AlertCircle } from "lucide-react";
import { notify } from "@/lib/notify";
import {
  sanitizeUrl,
  truncateText,
  encodeMetaTag,
} from "@/lib/security";

// Enterprise-level validation constants
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

// Whitelisted OG types
const ALLOWED_OG_TYPES = [
  "website",
  "article",
  "book",
  "profile",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
] as const;

// Whitelisted Twitter card types
const ALLOWED_TWITTER_CARDS = [
  "summary",
  "summary_large_image",
  "app",
  "player",
] as const;

// Whitelisted locales (OG format uses underscore: en_US)
const ALLOWED_LOCALES = [
  "en_US",
  "en_GB",
  "es_ES",
  "es_MX",
  "fr_FR",
  "de_DE",
  "it_IT",
  "pt_BR",
  "pt_PT",
  "ru_RU",
  "ja_JP",
  "ko_KR",
  "zh_CN",
  "zh_TW",
  "ar_SA",
  "nl_NL",
  "pl_PL",
  "tr_TR",
  "sv_SE",
  "nb_NO",
  "da_DK",
  "fi_FI",
  "cs_CZ",
  "el_GR",
  "he_IL",
  "hi_IN",
  "th_TH",
  "vi_VN",
  "id_ID",
  "ms_MY",
  "uk_UA",
] as const;

type OGType = (typeof ALLOWED_OG_TYPES)[number];
type TwitterCard = (typeof ALLOWED_TWITTER_CARDS)[number];
type Locale = (typeof ALLOWED_LOCALES)[number];

const coerceOGType = (val: string): OGType =>
  ALLOWED_OG_TYPES.includes(val as OGType) ? (val as OGType) : "website";

const coerceTwitterCard = (val: string): TwitterCard =>
  ALLOWED_TWITTER_CARDS.includes(val as TwitterCard)
    ? (val as TwitterCard)
    : "summary_large_image";

const coerceLocale = (val: string): Locale =>
  ALLOWED_LOCALES.includes(val as Locale) ? (val as Locale) : "en_US";

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
    themeColor: "#000000",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [generatedTags, setGeneratedTags] = useState<string | null>(null);

  // ---------- VALIDATION HELPERS ----------

  const validateSecureUrl = (
    url: string,
    fieldName: string,
    required: boolean = false
  ): string | null => {
    if (!url.trim()) {
      return required ? `${fieldName} is required` : null;
    }

    // Control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(url)) {
      return `${fieldName} contains invalid control characters`;
    }

    const sanitized = sanitizeUrl(url, true);
    if (!sanitized) {
      return `${fieldName} must be a valid HTTPS URL (http:// and dangerous protocols are not allowed)`;
    }

    const maxLength = VALIDATION_LIMITS.OG_IMAGE_URL_MAX;
    if (sanitized.length > maxLength) {
      return `${fieldName} must be less than ${maxLength} characters`;
    }

    return null;
  };

  const validateTextField = (
    text: string,
    fieldName: string,
    maxLength: number,
    required: boolean = false
  ): string | null => {
    if (!text.trim()) {
      return required ? `${fieldName} is required` : null;
    }

    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
      return `${fieldName} contains invalid control characters`;
    }

    if (text.length > maxLength) {
      return `${fieldName} must be less than ${maxLength} characters`;
    }

    return null;
  };

  const validateTwitterHandle = (
    handle: string,
    fieldName: string
  ): string | null => {
    if (!handle.trim()) return null;

    const clean = handle.trim();
    if (!clean.startsWith("@")) {
      return `${fieldName} must start with @`;
    }

    const username = clean.slice(1);
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return `${fieldName} must be @username with 1-15 alphanumeric characters or underscores`;
    }

    return null;
  };

  const validateDimension = (value: string, fieldName: string): string | null => {
    if (!value.trim()) return null;

    const num = parseInt(value, 10);
    if (isNaN(num) || !isFinite(num) || num < 1) {
      return `${fieldName} must be a positive number`;
    }

    if (num > Number.MAX_SAFE_INTEGER) {
      return `${fieldName} exceeds maximum safe integer value`;
    }

    const max = fieldName.includes("Width")
      ? VALIDATION_LIMITS.IMAGE_WIDTH_MAX
      : VALIDATION_LIMITS.IMAGE_HEIGHT_MAX;
    if (num > max) {
      return `${fieldName} must be less than ${max}px`;
    }

    return null;
  };

  const validateColor = (color: string): string | null => {
    if (!color.trim()) return null;
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return "Theme color must be a valid hex color (#RRGGBB)";
    }
    return null;
  };

  const validateAllFields = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Basic meta
    errors.title = validateTextField(
      formData.title,
      "Title",
      VALIDATION_LIMITS.TITLE_MAX,
      true
    );
    errors.description = validateTextField(
      formData.description,
      "Description",
      VALIDATION_LIMITS.DESCRIPTION_MAX
    );
    errors.keywords = validateTextField(
      formData.keywords,
      "Keywords",
      VALIDATION_LIMITS.KEYWORDS_MAX
    );
    errors.author = validateTextField(
      formData.author,
      "Author",
      VALIDATION_LIMITS.AUTHOR_MAX
    );

    // OG
    errors.ogTitle = validateTextField(
      formData.ogTitle,
      "OG Title",
      VALIDATION_LIMITS.TITLE_MAX
    );
    errors.ogDescription = validateTextField(
      formData.ogDescription,
      "OG Description",
      VALIDATION_LIMITS.DESCRIPTION_MAX
    );
    errors.ogSiteName = validateTextField(
      formData.ogSiteName,
      "OG Site Name",
      VALIDATION_LIMITS.SITE_NAME_MAX
    );
    errors.ogImageAlt = validateTextField(
      formData.ogImageAlt,
      "OG Image Alt Text",
      VALIDATION_LIMITS.IMAGE_ALT_MAX
    );

    errors.ogImage = validateSecureUrl(
      formData.ogImage,
      "OG Image URL"
    );
    errors.ogUrl = validateSecureUrl(formData.ogUrl, "OG URL");
    errors.canonicalUrl = validateSecureUrl(
      formData.canonicalUrl,
      "Canonical URL"
    );

    errors.ogImageWidth = validateDimension(
      formData.ogImageWidth,
      "OG Image Width"
    );
    errors.ogImageHeight = validateDimension(
      formData.ogImageHeight,
      "OG Image Height"
    );

    errors.twitterSite = validateTwitterHandle(
      formData.twitterSite,
      "Twitter Site"
    );
    errors.twitterCreator = validateTwitterHandle(
      formData.twitterCreator,
      "Twitter Creator"
    );

    errors.themeColor = validateColor(formData.themeColor);

    if (!(ALLOWED_OG_TYPES as readonly string[]).includes(formData.ogType)) {
      errors.ogType = "Invalid Open Graph type selected";
    }

    if (
      !(ALLOWED_TWITTER_CARDS as readonly string[]).includes(
        formData.twitterCard
      )
    ) {
      errors.twitterCard = "Invalid Twitter Card type selected";
    }

    if (
      !(ALLOWED_LOCALES as readonly string[]).includes(formData.ogLocale)
    ) {
      errors.ogLocale = "Invalid locale selected";
    }

    Object.keys(errors).forEach((key) => {
      if (errors[key] === null) delete errors[key];
    });

    return errors;
  };

  // ---------- INPUT HANDLING ----------

  const handleInputChange = (field: string, value: string) => {
    const maxAllowedLength = 10000;
    if (value.length > maxAllowedLength) {
      notify.error(
        `Input too large. Maximum ${maxAllowedLength} characters allowed.`
      );
      return;
    }

    let safeValue: string = value;
    if (field === "ogType") safeValue = coerceOGType(value);
    if (field === "twitterCard") safeValue = coerceTwitterCard(value);
    if (field === "ogLocale") safeValue = coerceLocale(value);

    setFormData((prev) => ({ ...prev, [field]: safeValue }));

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    // If user edits after generating, clear preview so it's not stale
    setGeneratedTags(null);
  };

  // ---------- META TAG GENERATION (ONLY META / LINK TAGS) ----------

  const generateMetaTagsString = (): string => {
    const {
      title,
      description,
      keywords,
      author,
      robots,
      language,
      charset,
      viewport,
      ogTitle,
      ogDescription,
      ogImage,
      ogUrl,
      ogType,
      ogSiteName,
      ogImageAlt,
      ogImageWidth,
      ogImageHeight,
      ogLocale,
      twitterCard,
      twitterSite,
      twitterCreator,
      canonicalUrl,
      themeColor,
    } = formData;

    const safeTitle = encodeMetaTag(
      truncateText(title.trim(), VALIDATION_LIMITS.TITLE_MAX)
    );

    const safeDescription = description.trim()
      ? encodeMetaTag(
          truncateText(description.trim(), VALIDATION_LIMITS.DESCRIPTION_MAX)
        )
      : "";

    const safeKeywords = keywords.trim()
      ? encodeMetaTag(
          truncateText(keywords.trim(), VALIDATION_LIMITS.KEYWORDS_MAX)
        )
      : "";

    const safeAuthor = author.trim()
      ? encodeMetaTag(
          truncateText(author.trim(), VALIDATION_LIMITS.AUTHOR_MAX)
        )
      : "";

    const safeOgTitle =
      (ogTitle.trim() || title.trim())
        ? encodeMetaTag(
            truncateText(
              (ogTitle.trim() || title.trim()),
              VALIDATION_LIMITS.TITLE_MAX
            )
          )
        : "";

    const safeOgDescription =
      (ogDescription.trim() || description.trim())
        ? encodeMetaTag(
            truncateText(
              (ogDescription.trim() || description.trim()),
              VALIDATION_LIMITS.DESCRIPTION_MAX
            )
          )
        : "";

    const safeOgSiteName = ogSiteName.trim()
      ? encodeMetaTag(
          truncateText(ogSiteName.trim(), VALIDATION_LIMITS.SITE_NAME_MAX)
        )
      : "";

    const safeOgImageAlt = ogImageAlt.trim()
      ? encodeMetaTag(
          truncateText(ogImageAlt.trim(), VALIDATION_LIMITS.IMAGE_ALT_MAX)
        )
      : "";

    const safeOgImage = ogImage.trim()
      ? sanitizeUrl(ogImage.trim(), true) || ""
      : "";

    const safeOgUrl = ogUrl.trim()
      ? sanitizeUrl(ogUrl.trim(), true) || ""
      : "";

    const safeCanonicalUrl = canonicalUrl.trim()
      ? sanitizeUrl(canonicalUrl.trim(), true) || ""
      : "";

    const safeTwitterSite = twitterSite.trim()
      ? encodeMetaTag(twitterSite.trim())
      : "";

    const safeTwitterCreator = twitterCreator.trim()
      ? encodeMetaTag(twitterCreator.trim())
      : "";

    const safeLang = encodeMetaTag(language);
    const safeCharset = encodeMetaTag(charset);
    const safeViewport = encodeMetaTag(viewport);
    const safeRobots = encodeMetaTag(robots);
    const safeOgType = encodeMetaTag(ogType);
    const safeTwitterCard = encodeMetaTag(twitterCard);
    const safeThemeColor = encodeMetaTag(themeColor);
    const safeOgLocale = encodeMetaTag(ogLocale);

    const safeImageWidth = ogImageWidth.trim()
      ? parseInt(ogImageWidth.trim(), 10)
      : null;
    const safeImageHeight = ogImageHeight.trim()
      ? parseInt(ogImageHeight.trim(), 10)
      : null;

    let metaTags = "";

    metaTags += `<meta charset="${safeCharset}">\n`;
    metaTags += `<meta name="viewport" content="${safeViewport}">\n`;
    metaTags += `<title>${safeTitle}</title>\n`;
    metaTags += `<meta name="robots" content="${safeRobots}">\n`;

    if (safeDescription) {
      metaTags += `<meta name="description" content="${safeDescription}">\n`;
    }
    if (safeKeywords) {
      metaTags += `<meta name="keywords" content="${safeKeywords}">\n`;
    }
    if (safeAuthor) {
      metaTags += `<meta name="author" content="${safeAuthor}">\n`;
    }
    if (themeColor) {
      metaTags += `<meta name="theme-color" content="${safeThemeColor}">\n`;
    }

    // Open Graph
    if (safeOgTitle) {
      metaTags += `<meta property="og:title" content="${safeOgTitle}">\n`;
    }
    if (safeOgDescription) {
      metaTags += `<meta property="og:description" content="${safeOgDescription}">\n`;
    }
    if (safeOgSiteName) {
      metaTags += `<meta property="og:site_name" content="${safeOgSiteName}">\n`;
    }
    if (safeOgImage) {
      metaTags += `<meta property="og:image" content="${encodeMetaTag(
        safeOgImage
      )}">\n`;
      if (safeImageWidth && safeImageWidth > 0) {
        metaTags += `<meta property="og:image:width" content="${safeImageWidth}">\n`;
      }
      if (safeImageHeight && safeImageHeight > 0) {
        metaTags += `<meta property="og:image:height" content="${safeImageHeight}">\n`;
      }
      if (safeOgImageAlt) {
        metaTags += `<meta property="og:image:alt" content="${safeOgImageAlt}">\n`;
      }
    }
    if (safeOgUrl) {
      metaTags += `<meta property="og:url" content="${encodeMetaTag(
        safeOgUrl
      )}">\n`;
    }
    metaTags += `<meta property="og:type" content="${safeOgType}">\n`;
    metaTags += `<meta property="og:locale" content="${safeOgLocale}">\n`;

    // Twitter
    metaTags += `<meta name="twitter:card" content="${safeTwitterCard}">\n`;
    if (safeTwitterSite) {
      metaTags += `<meta name="twitter:site" content="${safeTwitterSite}">\n`;
    }
    if (safeTwitterCreator) {
      metaTags += `<meta name="twitter:creator" content="${safeTwitterCreator}">\n`;
    }
    if (safeOgTitle) {
      metaTags += `<meta name="twitter:title" content="${safeOgTitle}">\n`;
    }
    if (safeOgDescription) {
      metaTags += `<meta name="twitter:description" content="${safeOgDescription}">\n`;
    }
    if (safeOgImage) {
      metaTags += `<meta name="twitter:image" content="${encodeMetaTag(
        safeOgImage
      )}">\n`;
      if (safeOgImageAlt) {
        metaTags += `<meta name="twitter:image:alt" content="${safeOgImageAlt}">\n`;
      }
    }

    // Canonical
    if (safeCanonicalUrl) {
      metaTags += `<link rel="canonical" href="${encodeMetaTag(
        safeCanonicalUrl
      )}">\n`;
    }

    // Comment for language (applied on <html> tag)
    metaTags = `<!-- Set on <html lang="${safeLang}"> -->\n` + metaTags;

    return metaTags.trim() + "\n";
  };

  const generateFullHtml = (metaTagsOnly: string): string => {
    const safeLang = encodeMetaTag(formData.language || "en");
    return `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
${metaTagsOnly
  .split("\n")
  .map((line) => (line ? "    " + line : ""))
  .join("\n")}
</head>
<body>
    <!-- Your content here -->
</body>
</html>
`;
  };

  // ---------- ACTION HANDLERS ----------

  const handleGenerate = () => {
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error(
        `Please fix ${Object.keys(errors).length} validation error${
          Object.keys(errors).length > 1 ? "s" : ""
        } before generating meta tags.`
      );
      setGeneratedTags(null);
      return;
    }

    const metaTags = generateMetaTagsString();
    setGeneratedTags(metaTags);
    notify.success("Meta tags generated!");
  };

  const copyToClipboard = async () => {
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error("Please fix validation errors before copying");
      return;
    }

    const metaTags = generatedTags ?? generateMetaTagsString();
    if (!generatedTags) {
      setGeneratedTags(metaTags);
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(metaTags);
      } else {
        const area = document.createElement("textarea");
        area.value = metaTags;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      notify.success("Meta tags copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      notify.error("Failed to copy meta tags.");
    }
  };

  const downloadMetaTags = () => {
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notify.error("Please fix validation errors before downloading");
      return;
    }

    try {
      const metaTags = generatedTags ?? generateMetaTagsString();
      if (!generatedTags) {
        setGeneratedTags(metaTags);
      }

      const fullHtml = generateFullHtml(metaTags);

      const blob = new Blob([fullHtml], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meta-tags.html";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      notify.success("Meta tags HTML downloaded!");
    } catch (err) {
      console.error("Failed to download: ", err);
      notify.error("Failed to download meta tags.");
    }
  };

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
      themeColor: "#000000",
    });
    setValidationErrors({});
    setGeneratedTags(null);
    notify.success("Form cleared!");
  };

  // ---------- RENDER ----------

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta Tag Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* BASIC META */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                placeholder="Enter page title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={validationErrors.title ? "border-red-500" : ""}
                aria-required="true"
                aria-invalid={!!validationErrors.title}
                aria-describedby={
                  validationErrors.title ? "title-error" : "title-hint"
                }
              />
              {validationErrors.title && (
                <p
                  id="title-error"
                  className="text-sm text-red-500 flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {validationErrors.title}
                </p>
              )}
              <p
                id="title-hint"
                className="text-xs text-muted-foreground"
              >
                {formData.title.length}/{VALIDATION_LIMITS.TITLE_MAX} characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Enter meta description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={2}
                className={
                  validationErrors.description ? "border-red-500" : ""
                }
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/
                {VALIDATION_LIMITS.DESCRIPTION_MAX} characters
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="keyword1, keyword2, keyword3"
                value={formData.keywords}
                onChange={(e) =>
                  handleInputChange("keywords", e.target.value)
                }
                className={validationErrors.keywords ? "border-red-500" : ""}
              />
              {validationErrors.keywords && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.keywords}
                </p>
              )}
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Author name"
                value={formData.author}
                onChange={(e) =>
                  handleInputChange("author", e.target.value)
                }
                className={validationErrors.author ? "border-red-500" : ""}
              />
              {validationErrors.author && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.author}
                </p>
              )}
            </div>

            {/* Robots */}
            <div className="space-y-2">
              <Label htmlFor="robots">Robots</Label>
              <Select
                value={formData.robots}
                onValueChange={(value) => handleInputChange("robots", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select robots directive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">
                    Index, Follow
                  </SelectItem>
                  <SelectItem value="noindex, follow">
                    No Index, Follow
                  </SelectItem>
                  <SelectItem value="index, nofollow">
                    Index, No Follow
                  </SelectItem>
                  <SelectItem value="noindex, nofollow">
                    No Index, No Follow
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  handleInputChange("language", value)
                }
              >
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

          {/* OPEN GRAPH */}
          <div className="space-y-4">
            <h3 className="font-semibold">Open Graph Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OG Title */}
              <div className="space-y-2">
                <Label htmlFor="og-title">OG Title</Label>
                <Input
                  id="og-title"
                  placeholder="Open Graph title"
                  value={formData.ogTitle}
                  onChange={(e) =>
                    handleInputChange("ogTitle", e.target.value)
                  }
                  className={validationErrors.ogTitle ? "border-red-500" : ""}
                />
                {validationErrors.ogTitle && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogTitle}
                  </p>
                )}
              </div>

              {/* OG Description */}
              <div className="space-y-2">
                <Label htmlFor="og-description">OG Description</Label>
                <Textarea
                  id="og-description"
                  placeholder="Open Graph description"
                  value={formData.ogDescription}
                  onChange={(e) =>
                    handleInputChange("ogDescription", e.target.value)
                  }
                  rows={2}
                  className={
                    validationErrors.ogDescription ? "border-red-500" : ""
                  }
                />
                {validationErrors.ogDescription && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogDescription}
                  </p>
                )}
              </div>

              {/* OG Site Name */}
              <div className="space-y-2">
                <Label htmlFor="og-site-name">OG Site Name</Label>
                <Input
                  id="og-site-name"
                  placeholder="Your Site Name"
                  value={formData.ogSiteName}
                  onChange={(e) =>
                    handleInputChange("ogSiteName", e.target.value)
                  }
                  className={
                    validationErrors.ogSiteName ? "border-red-500" : ""
                  }
                />
                {validationErrors.ogSiteName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogSiteName}
                  </p>
                )}
              </div>

              {/* OG Locale */}
              <div className="space-y-2">
                <Label htmlFor="og-locale">OG Locale</Label>
                <Select
                  value={formData.ogLocale}
                  onValueChange={(value) =>
                    handleInputChange("ogLocale", value)
                  }
                >
                  <SelectTrigger
                    className={
                      validationErrors.ogLocale ? "border-red-500" : ""
                    }
                  >
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
                    <SelectItem value="pt_BR">
                      Portuguese (Brazil)
                    </SelectItem>
                    <SelectItem value="pt_PT">
                      Portuguese (Portugal)
                    </SelectItem>
                    <SelectItem value="ja_JP">Japanese</SelectItem>
                    <SelectItem value="ko_KR">Korean</SelectItem>
                    <SelectItem value="zh_CN">
                      Chinese (Simplified)
                    </SelectItem>
                    <SelectItem value="zh_TW">
                      Chinese (Traditional)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.ogLocale && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogLocale}
                  </p>
                )}
              </div>

              {/* OG Image URL */}
              <div className="space-y-2">
                <Label htmlFor="og-image">OG Image URL (HTTPS Required)</Label>
                <Input
                  id="og-image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.ogImage}
                  onChange={(e) =>
                    handleInputChange("ogImage", e.target.value)
                  }
                  className={validationErrors.ogImage ? "border-red-500" : ""}
                />
                {validationErrors.ogImage && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImage}
                  </p>
                )}
              </div>

              {/* OG Image Alt */}
              <div className="space-y-2">
                <Label htmlFor="og-image-alt">OG Image Alt Text</Label>
                <Input
                  id="og-image-alt"
                  placeholder="Description of the image"
                  value={formData.ogImageAlt}
                  onChange={(e) =>
                    handleInputChange("ogImageAlt", e.target.value)
                  }
                  className={
                    validationErrors.ogImageAlt ? "border-red-500" : ""
                  }
                />
                {validationErrors.ogImageAlt && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageAlt}
                  </p>
                )}
              </div>

              {/* OG Image Width */}
              <div className="space-y-2">
                <Label htmlFor="og-image-width">OG Image Width (px)</Label>
                <Input
                  id="og-image-width"
                  type="number"
                  placeholder="1200"
                  value={formData.ogImageWidth}
                  onChange={(e) =>
                    handleInputChange("ogImageWidth", e.target.value)
                  }
                  className={
                    validationErrors.ogImageWidth ? "border-red-500" : ""
                  }
                />
                {validationErrors.ogImageWidth && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageWidth}
                  </p>
                )}
              </div>

              {/* OG Image Height */}
              <div className="space-y-2">
                <Label htmlFor="og-image-height">OG Image Height (px)</Label>
                <Input
                  id="og-image-height"
                  type="number"
                  placeholder="630"
                  value={formData.ogImageHeight}
                  onChange={(e) =>
                    handleInputChange("ogImageHeight", e.target.value)
                  }
                  className={
                    validationErrors.ogImageHeight ? "border-red-500" : ""
                  }
                />
                {validationErrors.ogImageHeight && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogImageHeight}
                  </p>
                )}
              </div>

              {/* OG URL */}
              <div className="space-y-2">
                <Label htmlFor="og-url">OG URL (HTTPS Required)</Label>
                <Input
                  id="og-url"
                  placeholder="https://example.com/page"
                  value={formData.ogUrl}
                  onChange={(e) =>
                    handleInputChange("ogUrl", e.target.value)
                  }
                  className={validationErrors.ogUrl ? "border-red-500" : ""}
                />
                {validationErrors.ogUrl && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.ogUrl}
                  </p>
                )}
              </div>

              {/* OG Type */}
              <div className="space-y-2">
                <Label htmlFor="og-type">OG Type</Label>
                <Select
                  value={formData.ogType}
                  onValueChange={(value) =>
                    handleInputChange("ogType", value)
                  }
                >
                  <SelectTrigger
                    className={validationErrors.ogType ? "border-red-500" : ""}
                  >
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

          {/* TWITTER */}
          <div className="space-y-4">
            <h3 className="font-semibold">Twitter Card Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Type */}
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Twitter Card Type</Label>
                <Select
                  value={formData.twitterCard}
                  onValueChange={(value) =>
                    handleInputChange("twitterCard", value)
                  }
                >
                  <SelectTrigger
                    className={
                      validationErrors.twitterCard ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">
                      Summary Large Image
                    </SelectItem>
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

              {/* Twitter Site */}
              <div className="space-y-2">
                <Label htmlFor="twitter-site">Twitter Site</Label>
                <Input
                  id="twitter-site"
                  placeholder="@yourwebsite"
                  value={formData.twitterSite}
                  onChange={(e) =>
                    handleInputChange("twitterSite", e.target.value)
                  }
                  className={
                    validationErrors.twitterSite ? "border-red-500" : ""
                  }
                />
                {validationErrors.twitterSite && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.twitterSite}
                  </p>
                )}
              </div>

              {/* Twitter Creator */}
              <div className="space-y-2">
                <Label htmlFor="twitter-creator">Twitter Creator</Label>
                <Input
                  id="twitter-creator"
                  placeholder="@yourusername"
                  value={formData.twitterCreator}
                  onChange={(e) =>
                    handleInputChange("twitterCreator", e.target.value)
                  }
                  className={
                    validationErrors.twitterCreator ? "border-red-500" : ""
                  }
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

          {/* ADDITIONAL TAGS */}
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Canonical URL */}
              <div className="space-y-2">
                <Label htmlFor="canonical-url">Canonical URL (HTTPS Required)</Label>
                <Input
                  id="canonical-url"
                  placeholder="https://example.com/canonical-page"
                  value={formData.canonicalUrl}
                  onChange={(e) =>
                    handleInputChange("canonicalUrl", e.target.value)
                  }
                  className={
                    validationErrors.canonicalUrl ? "border-red-500" : ""
                  }
                />
                {validationErrors.canonicalUrl && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.canonicalUrl}
                  </p>
                )}
              </div>

              {/* Theme Color */}
              <div className="space-y-2">
                <Label htmlFor="theme-color">Theme Color</Label>
                <Input
                  id="theme-color"
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) =>
                    handleInputChange("themeColor", e.target.value)
                  }
                  className={
                    validationErrors.themeColor ? "border-red-500" : ""
                  }
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

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleGenerate}
              className="flex-1 w-full sm:w-auto"
            >
              Generate Meta Tags
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Meta Tags
            </Button>
            <Button
              onClick={downloadMetaTags}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW CARD - ONLY AFTER GENERATION */}
      {generatedTags && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Meta Tags Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm break-words">
                {generatedTags}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO BEST PRACTICES */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep title tags between 50–60 characters for optimal display</li>
            <li>• Meta descriptions should be 150–160 characters</li>
            <li>• Use relevant keywords naturally in your content</li>
            <li>• Include Open Graph tags for better social media sharing</li>
            <li>• Set up canonical URLs to avoid duplicate content issues</li>
            <li>• Use descriptive alt text for images (accessibility + SEO)</li>
            <li>• Ensure your site is mobile-friendly with a proper viewport meta tag</li>
            <li>• OG images should be ~1200×630px for best social sharing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
