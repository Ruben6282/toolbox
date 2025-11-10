# Mijn Project

## Project info

Dit project is een Vite + React + shadcn-ui + Tailwind CSS applicatie.

## Features
* Collection of various utility tools built with React, TypeScript, shadcn/ui, Tailwind CSS, and Vite.
* Easy to use interface with responsive design.
* Tools cover text, calculations, conversions, and more.

## Image Tool Security Hardening

All image-related tools (`AddWatermark`, `ImageCropper`, `ImageFormatConverter`, `ImageGrayscale`, `ImageResizer`, `ImageToBase64`, `MemeGenerator`) have been hardened for production security. Lifecycle, validation, and transformation logic are now unified through shared utilities.

### File Handling
* Strict MIME/type & size validation via `validateImageFile` (JPEG, PNG, WebP, GIF; max 10MB by default) before any canvas access.
* Dimension guardrail: images larger than `MAX_IMAGE_DIMENSION` (4096px per axis) are downscaled with `enforceMaxDimensions` while preserving aspect ratio.
* `accept` attributes narrowed to allowed types to reduce accidental selection of unsupported formats.
* Filenames sanitized where used (download names, metadata) with `sanitizeFilename`.

### Text Sanitization
* User-provided text (watermark text, meme captions) stripped of HTML tags (`stripHtml`) and length-limited (`truncateText`).
* No `dangerouslySetInnerHTML` / raw HTML injection in image tools.

### Canvas Safety
* Images loaded into `<canvas>` only after validation; no untrusted remote URLs currently accepted.
* `crossOrigin="anonymous"` used defensively to avoid taint issues if future remote sources are introduced.

### Object URL Lifecycle (Unified)
* Central hook `useObjectUrls` now manages creation, optional downscaling, tracking, and automatic cleanup of all blob URLs on unmount.
* Prior ad-hoc cleanup logic replaced for consistency and reduced leak surface (AddWatermark, ImageCropper, MemeGenerator, ImageResizer, etc.).
* Re-validation and conditional revocation performed when replacing existing previews or watermark images.

### Defensive Coding
* Try/catch with console warnings for non-critical failures (e.g., revoking URLs) ensures stability without hiding issues.
* Comments added for manual review where future feature expansion could require revisiting logic (e.g., aspect ratio / resizer flows).

### Current Scope Note
* No direct user-supplied external image URLs exist; if added later, use `sanitizeUrl` (enforces http/https and blocks dangerous schemes) and verify extension.

### Recommended Future Enhancements
* Explicit EXIF/metadata stripping (canvas redraw removes most, but GPS/address fields in some edge cases may persist when bypassing canvas).
* Web Worker offloading for heavy transforms (batch resize + format conversion) to prevent main-thread jank.
* Animated GIF multi-frame support or user messaging clarifying first-frame-only behavior.
* Additional heuristic memory guard (e.g., abort if width * height * 4 bytes > threshold after downscale).
* Optional content hashing of uploaded images for deduplication without storing raw binaries.

### Quality Gates Summary
* Build: PASS (`npm run build` successful)
* Lint: Existing non-security warnings (CSS dynamic shadow token etc.) unchanged; refactors introduced no new actionable issues.
* Tests: Pending – recommend adding unit tests for `validateImageFile`, `enforceMaxDimensions`, and text sanitization edge cases.

### Security Philosophy
Favor explicit validation & lifecycle control: every image passes through guarded upload → optional downscale → controlled canvas draw; object URLs never linger after component unmount. Transformations stay client-side (no server round-trips) minimizing attack surface and privacy exposure. Remaining enhancements focus on privacy hardening (EXIF) and performance resilience.
