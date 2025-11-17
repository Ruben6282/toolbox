import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Download,
  Type,
  Image as ImageIcon,
  Trash2,
  Copy,
  X,
} from "lucide-react"
import { notify } from "@/lib/notify"
import {
  ALLOWED_IMAGE_TYPES,
  stripHtml,
  truncateText,
  MAX_IMAGE_DIMENSION,
  validateImageFile,
} from "@/lib/security"
import { useObjectUrls } from "@/hooks/use-object-urls"

const MAX_FILE_SIZE_MB = 10
const MAX_WATERMARKS = 50

// Logical base sizing for watermark physics (canvas-pixel space)
const TEXT_BASE_FONT_SIZE = 32 // px
const TEXT_CHAR_WIDTH_FACTOR = 0.6 // rough average width factor per character
const TEXT_MIN_LOGICAL_WIDTH = 120 // px fallback for very short text
const LOGO_BASE_SIZE = 128 // px square – logical logo size

type Watermark = {
  id: string
  type: "text" | "image"
  text?: string
  src?: string
  x: number // canvas pixels
  y: number // canvas pixels
  scale: number
  rotation: number
  opacity: number
  color?: string
}

type ImageDims = {
  width: number
  height: number
}

/**
 * Detect image format via magic bytes (file signature)
 * Prevents MIME spoofing attacks
 */
async function sniffMime(file: File): Promise<string | null> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png"
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg"
    }

    // WebP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp"
    }

    // GIF: GIF87a or GIF89a (we don’t animate, but we allow static first frame input)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return "image/gif"
    }

    // BMP: BM
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return "image/bmp"
    }

    return null
  } catch (err) {
    console.error("sniffMime error:", err)
    return null
  }
}

// Compute logical half-width/half-height in canvas pixels for clamping
// Used as a fallback; we override with real measurements when available.
function getLogicalHalfSize(wm: Watermark): { halfWidth: number; halfHeight: number } {
  let logicalWidth: number
  let logicalHeight: number

  if (wm.type === "text") {
    const text = wm.text ?? ""
    const charCount = text.length || 1
    const baseWidth = Math.max(
      TEXT_MIN_LOGICAL_WIDTH,
      charCount * TEXT_BASE_FONT_SIZE * TEXT_CHAR_WIDTH_FACTOR
    )
    logicalWidth = baseWidth
    // Slightly larger than font size to better match actual rendered box
    logicalHeight = TEXT_BASE_FONT_SIZE * 1.25
  } else {
    logicalWidth = LOGO_BASE_SIZE
    logicalHeight = LOGO_BASE_SIZE
  }

  const halfWidth = (logicalWidth * wm.scale) / 2
  const halfHeight = (logicalHeight * wm.scale) / 2
  return { halfWidth, halfHeight }
}

export const AddWatermark = () => {
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<ImageDims | null>(null)

  const [watermarks, setWatermarks] = useState<Watermark[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [sheetCollapsed, setSheetCollapsed] = useState(false)

  // Visual scale factor for editor (CSS space vs canvas pixels)
  const [displayScale, setDisplayScale] = useState(1)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wmRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Hidden span for measuring text in DOM (unscaled by transform)
  const textMeasureRef = useRef<HTMLSpanElement | null>(null)

  const { createImageUrl } = useObjectUrls()

  // ----------- Responsive: detect mobile -----------

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // When selecting a WM on mobile, start collapsed to keep canvas visible
  useEffect(() => {
    if (activeId && isMobile) setSheetCollapsed(true)
  }, [activeId, isMobile])

  // ----------- Compute displayScale so image fits nicely on all devices -----------

  useEffect(() => {
    if (!imageDims) return

    const computeScale = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Approximate horizontal space inside the card
      const containerWidth =
        containerRef.current?.clientWidth ?? Math.max(320, viewportWidth - 32)

      // Reserve some vertical space for header + toolbar + margins
      const maxEditorHeight = Math.max(200, viewportHeight - 260)

      const scaleByWidth = containerWidth / imageDims.width
      const scaleByHeight = maxEditorHeight / imageDims.height

      const scale = Math.min(scaleByWidth, scaleByHeight, 1) // never upscale
      setDisplayScale(scale > 0 && Number.isFinite(scale) ? scale : 1)
    }

    computeScale()
    window.addEventListener("resize", computeScale)
    return () => window.removeEventListener("resize", computeScale)
  }, [imageDims])

  // ----------- Global pointer move/up for dragging (logical coords) -----------

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingId || !imageDims) return
      const lastPos = lastPosRef.current
      if (!lastPos) return

      const dxScreen = e.clientX - lastPos.x
      const dyScreen = e.clientY - lastPos.y

      // Convert from screen pixels -> canvas logical pixels
      const dx = dxScreen / displayScale
      const dy = dyScreen / displayScale

      setWatermarks((prev) =>
        prev.map((wm) => {
          if (wm.id !== draggingId) return wm

          let newX = wm.x + dx
          let newY = wm.y + dy

          // Base logical size as fallback
          const logical = getLogicalHalfSize(wm)
          let halfWidth = logical.halfWidth
          let halfHeight = logical.halfHeight

          const el = wmRefs.current[wm.id]

          // Rotation in radians
          const theta = (wm.rotation * Math.PI) / 180
          const cos = Math.cos(theta)
          const sin = Math.sin(theta)

          // Text watermark: measure via hidden span (unaffected by transform)
          if (wm.type === "text" && textMeasureRef.current) {
            const m = textMeasureRef.current
            m.style.fontSize = `${TEXT_BASE_FONT_SIZE * displayScale}px`
            m.style.fontFamily =
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            m.style.fontWeight = "bold"
            m.textContent = wm.text ?? ""

            const wScreen = m.offsetWidth
            const hScreen = m.offsetHeight

            if (wScreen > 0 && hScreen > 0) {
              // Convert back to canvas logical pixels
              const w = wScreen / displayScale
              const h = hScreen / displayScale

              // Apply scale
              const ws = w * wm.scale
              const hs = h * wm.scale

              // Rotation-aware bounding box
              const rotatedW = Math.abs(ws * cos) + Math.abs(hs * sin)
              const rotatedH = Math.abs(ws * sin) + Math.abs(hs * cos)

              halfWidth = rotatedW / 2
              halfHeight = rotatedH / 2
            }
          }

          // Image watermark: approximate using logo base size + natural aspect
          if (wm.type === "image") {
            const imgEl = el?.querySelector("img") as HTMLImageElement | null
            if (imgEl && imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
              const aspect = imgEl.naturalWidth / imgEl.naturalHeight
              let baseW = LOGO_BASE_SIZE
              let baseH = LOGO_BASE_SIZE

              if (aspect > 1) {
                baseH = baseW / aspect
              } else {
                baseW = baseH * aspect
              }

              const w = baseW
              const h = baseH

              const ws = w * wm.scale
              const hs = h * wm.scale

              const rotatedW = Math.abs(ws * cos) + Math.abs(hs * sin)
              const rotatedH = Math.abs(ws * sin) + Math.abs(hs * cos)

              halfWidth = rotatedW / 2
              halfHeight = rotatedH / 2
            }
          }

          // Clamp center position so rotated, scaled watermark stays fully inside
          newX = Math.max(halfWidth, Math.min(imageDims.width - halfWidth, newX))
          newY = Math.max(halfHeight, Math.min(imageDims.height - halfHeight, newY))

          return { ...wm, x: newX, y: newY }
        })
      )

      lastPosRef.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerUp = () => {
      setDraggingId(null)
      lastPosRef.current = null
    }

    if (draggingId) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true })
      window.addEventListener("pointerup", handlePointerUp, { passive: true })
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [draggingId, imageDims, displayScale])

  // ----------- Click-outside closes desktop popup -----------

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!activeId) return
      const popup = document.getElementById("watermark-popup")
      const target = e.target as Node | null

      // If click is inside the popup, do nothing
      if (popup && target && popup.contains(target)) {
        return
      }

      // Anywhere else: close the popup
      setActiveId(null)
    }

    if (activeId && !isMobile) {
      window.addEventListener("click", handleClickOutside)
      return () => window.removeEventListener("click", handleClickOutside)
    }
  }, [activeId, isMobile])

  // ----------- Upload handlers -----------

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed.")
      return
    }

    const sniffed = await sniffMime(file)
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.")
      return
    }

    const validationError = (() => {
      try {
        return validateImageFile(file)
      } catch (err) {
        console.error("validateImageFile error:", err)
        return "Failed to validate image file."
      }
    })()

    if (validationError) {
      notify.error(validationError)
      return
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    })

    if (!url) {
      notify.error("Failed to create image URL.")
      return
    }

    const img = new Image()
    img.onload = () => {
      setImageDims({ width: img.width, height: img.height })
      setBaseImageUrl(url)
      setWatermarks([])
      setActiveId(null)
      notify.success("Image uploaded successfully!")
    }
    img.onerror = () => {
      notify.error("Failed to read image dimensions.")
    }
    img.src = url
  }

  const handleLogoUpload = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`Logo size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error("Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed.")
      return
    }

    const sniffed = await sniffMime(file)
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.")
      return
    }

    const validationError = (() => {
      try {
        return validateImageFile(file)
      } catch (err) {
        console.error("validateImageFile error:", err)
        return "Failed to validate logo file."
      }
    })()

    if (validationError) {
      notify.error(validationError)
      return
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    })
    if (!url) {
      notify.error("Failed to load logo.")
      return
    }

    setWatermarks((prev) =>
      prev.map((wm) => (wm.id === id ? { ...wm, src: url } : wm))
    )
    notify.success("Logo uploaded successfully!")
  }

  // ----------- Toolbar actions -----------

  const addWatermark = (type: "text" | "image") => {
    if (!imageDims) {
      notify.error("Upload an image first.")
      return
    }

    if (watermarks.length >= MAX_WATERMARKS) {
      notify.error(`Maximum of ${MAX_WATERMARKS} watermarks reached.`)
      return
    }

    const newWM: Watermark = {
      id: crypto.randomUUID(),
      type,
      text: type === "text" ? "Your Text" : undefined,
      x: imageDims.width / 2,
      y: imageDims.height / 2,
      scale: 1,
      rotation: 0,
      opacity: 100,
      color: "#000000",
    }

    setWatermarks((prev) => [...prev, newWM])
    setActiveId(newWM.id)
    if (isMobile) setSheetCollapsed(false)

    notify.success(`${type === "text" ? "Text" : "Image"} watermark added!`)
  }

  const removeAll = () => {
    if (watermarks.length === 0) {
      notify.error("No watermarks to remove.")
      return
    }
    setWatermarks([])
    setActiveId(null)
    notify.success("All watermarks removed!")
  }

  const updateWatermark = (id: string, changes: Partial<Watermark>) => {
    setWatermarks((prev) =>
      prev.map((wm) => (wm.id === id ? { ...wm, ...changes } : wm))
    )
  }

  // ----------- Dragging -----------

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: string
  ) => {
    e.stopPropagation()
    e.preventDefault()
    setDraggingId(id)
    setActiveId(id)
    lastPosRef.current = { x: e.clientX, y: e.clientY }
  }

  // ----------- Generate final image (canvas-sized) -----------

  const generateFinalImage = () => {
    if (!baseImageUrl || !canvasRef.current || !imageDims) {
      notify.error("No image to export.")
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      notify.error("Canvas not supported.")
      return
    }

    const base = new Image()
    base.decoding = "async"

    base.onload = async () => {
      canvas.width = imageDims.width
      canvas.height = imageDims.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height)

      for (const wm of watermarks) {
        ctx.save()
        ctx.globalAlpha = wm.opacity / 100

        ctx.translate(wm.x, wm.y)
        ctx.rotate((wm.rotation * Math.PI) / 180)
        ctx.scale(wm.scale, wm.scale)

        if (wm.type === "text" && wm.text) {
          const fontFamily =
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          ctx.font = `bold ${TEXT_BASE_FONT_SIZE}px ${fontFamily}`
          ctx.fillStyle = wm.color || "#000000"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(wm.text, 0, 0)
        } else if (wm.type === "image" && wm.src) {
          const img = await new Promise<HTMLImageElement | null>((resolve) => {
            const i = new Image()
            i.decoding = "async"
            i.onload = () => resolve(i)
            i.onerror = () => resolve(null)
            i.src = wm.src!
          })

          if (img) {
            const aspect = img.width / img.height
            let drawW = LOGO_BASE_SIZE
            let drawH = LOGO_BASE_SIZE
            if (aspect > 1) {
              drawH = drawW / aspect
            } else {
              drawW = drawH * aspect
            }
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
          }
        }

        ctx.restore()
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            notify.error("Failed to create image blob.")
            return
          }
          try {
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.download = "watermarked-image.png"
            link.href = url
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 0)
            notify.success("Watermarked image downloaded!")
          } catch (err) {
            console.error("Download error:", err)
            notify.error("Failed to download image.")
          }
        },
        "image/png",
        0.92
      )
    }

    base.onerror = () => {
      notify.error("Failed to load base image for export.")
    }

    base.src = baseImageUrl
  }

  // ----------- Shared controls renderer -----------

  const renderControlsContent = (wm: Watermark, isMobileVariant: boolean) => {
    const id = wm.id

    return (
      <div
        className={
          isMobileVariant
            ? "pt-0 pb-6 px-4 space-y-4 overflow-y-auto max-h-[50vh] bg-card"
            : "space-y-3"
        }
      >
        {wm.type === "text" && (
          <div
            className={
              isMobileVariant
                ? "space-y-3 p-3 bg-muted/30 rounded-lg border border-border"
                : "space-y-2"
            }
          >
            <div>
              <Label className={isMobileVariant ? "text-xs mb-1.5 block" : ""}>
                Text
              </Label>
              <Textarea
                rows={2}
                value={wm.text}
                onChange={(e) => {
                  const safe = truncateText(stripHtml(e.target.value), 200)
                  updateWatermark(id, { text: safe })
                }}
                className={isMobileVariant ? "text-sm resize-none" : ""}
                placeholder="Enter watermark text"
              />
            </div>
            <div>
              <Label className={isMobileVariant ? "text-xs mb-1.5 block" : ""}>
                Text Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={wm.color}
                  onChange={(e) =>
                    updateWatermark(id, { color: e.target.value })
                  }
                  className={
                    isMobileVariant ? "h-10 w-20 p-1 cursor-pointer" : ""
                  }
                />
                {isMobileVariant && (
                  <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border">
                    {wm.color}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {wm.type === "image" && !wm.src && (
          <div
            className={
              isMobileVariant
                ? "p-3 bg-muted/30 rounded-lg border border-border"
                : "space-y-1"
            }
          >
            <Label className={isMobileVariant ? "text-xs mb-1.5 block" : ""}>
              Upload Logo
            </Label>
            <Input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              onChange={(e) => handleLogoUpload(id, e)}
              className={isMobileVariant ? "text-xs cursor-pointer" : ""}
            />
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={isMobileVariant ? "text-xs" : ""}>Opacity</Label>
            <span
              className={
                isMobileVariant
                  ? "text-xs font-mono bg-muted px-2 py-0.5 rounded"
                  : "text-xs font-mono"
              }
            >
              {wm.opacity}%
            </span>
          </div>
          <Slider
            value={[wm.opacity]}
            onValueChange={(v) =>
              updateWatermark(id, { opacity: v[0] ?? wm.opacity })
            }
            min={10}
            max={100}
          />
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={isMobileVariant ? "text-xs" : ""}>Scale</Label>
            <span
              className={
                isMobileVariant
                  ? "text-xs font-mono bg-muted px-2 py-0.5 rounded"
                  : "text-xs font-mono"
              }
            >
              {wm.scale.toFixed(2)}x
            </span>
          </div>
          <Slider
            value={[wm.scale]}
            onValueChange={(v) =>
              updateWatermark(id, { scale: v[0] ?? wm.scale })
            }
            min={0.2}
            max={3}
            step={0.1}
          />
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className={isMobileVariant ? "text-xs" : ""}>
              Rotation
            </Label>
            <span
              className={
                isMobileVariant
                  ? "text-xs font-mono bg-muted px-2 py-0.5 rounded"
                  : "text-xs font-mono"
              }
            >
              {wm.rotation}°
            </span>
          </div>
          <Slider
            value={[wm.rotation]}
            onValueChange={(v) =>
              updateWatermark(id, { rotation: v[0] ?? wm.rotation })
            }
            min={-180}
            max={180}
          />
        </div>

        {/* Actions */}
        <div
          className={
            isMobileVariant
              ? "flex gap-2 pt-2 border-t border-border"
              : "flex gap-2 mt-2"
          }
        >
          <Button
            size={isMobileVariant ? "sm" : "default"}
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (!imageDims) return
              const clone: Watermark = {
                ...wm,
                id: crypto.randomUUID(),
                x: Math.min(wm.x + 20, imageDims.width - 10),
                y: Math.min(wm.y + 20, imageDims.height - 10),
              }
              setWatermarks((prev) => [...prev, clone])
              notify.success("Watermark duplicated!")
            }}
          >
            <Copy className="w-4 h-4 mr-1.5" />
            Duplicate
          </Button>
          <Button
            size={isMobileVariant ? "sm" : "default"}
            variant="destructive"
            className="flex-1"
            onClick={() => {
              setWatermarks((prev) => prev.filter((w) => w.id !== id))
              setActiveId((current) => (current === id ? null : current))
              notify.success("Watermark deleted!")
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    )
  }

  // ----------- Render -----------

  const activeWatermark = activeId
    ? watermarks.find((w) => w.id === activeId) || null
    : null

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      {/* Toolbar */}
      {baseImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Watermark Toolbar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addWatermark("text")
              }}
              className="w-full sm:w-auto"
            >
              <Type className="w-4 h-4 mr-2" />
              Add Text
            </Button>
            <Button
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addWatermark("image")
              }}
              className="w-full sm:w-auto"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Logo
            </Button>
            <Button
              variant="destructive"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeAll()
              }}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview + editor */}
      {baseImageUrl && imageDims && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* No inner scrolling; the card hugs the (scaled) image */}
            <div ref={containerRef} className="w-full flex justify-center">
              <div
                ref={editorRef}
                className="relative"
                style={{
                  width: `${imageDims.width * displayScale}px`,
                  height: `${imageDims.height * displayScale}px`,
                }}
              >
                <img
                  src={baseImageUrl}
                  alt="Uploaded"
                  className="block"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  draggable={false}
                />

                {watermarks.map((wm) => (
                  <div
                    key={wm.id}
                    ref={(el) => {
                      wmRefs.current[wm.id] = el
                    }}
                    className={`absolute cursor-move select-none ${
                      activeId === wm.id ? "outline outline-blue-500" : ""
                    }`}
                    style={{
                      left: wm.x * displayScale,
                      top: wm.y * displayScale,
                      transform: `translate(-50%, -50%) scale(${wm.scale}) rotate(${wm.rotation}deg)`,
                      transformOrigin: "center center",
                      opacity: wm.opacity / 100,
                      color: wm.color,
                      fontSize: `${TEXT_BASE_FONT_SIZE * displayScale}px`,
                      fontWeight: "bold",
                      zIndex: 10,
                      touchAction: "none",
                      whiteSpace: wm.type === "text" ? "nowrap" : undefined,
                    }}
                    data-wm-active={activeId === wm.id ? "true" : undefined}
                    onPointerDown={(e) => handlePointerDown(e, wm.id)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveId(wm.id)
                    }}
                  >
                    {wm.type === "text" ? (
                      <span>{wm.text}</span>
                    ) : wm.src ? (
                      <img
                        src={wm.src}
                        alt="logo"
                        className="block"
                        style={{
                          width: `${LOGO_BASE_SIZE * displayScale}px`,
                          height: `${LOGO_BASE_SIZE * displayScale}px`,
                          objectFit: "contain",
                        }}
                        draggable={false}
                      />
                    ) : (
                      <Input
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={(e) => handleLogoUpload(wm.id, e)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Download button */}
            <div className="mt-4 flex justify-center">
              <div
                aria-live="polite"
                aria-atomic="true"
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={generateFinalImage}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    generateFinalImage()
                  }}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Watermarked Image
                </Button>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}

      {/* Popups rendered OUTSIDE the scaled editor so they keep normal size */}

      {activeWatermark && !draggingId && baseImageUrl && (
        <>
          {/* Mobile bottom sheet */}
          {isMobile && (
            <div
              id="watermark-popup"
              className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
            >
              <div className="pointer-events-auto">
                {!sheetCollapsed && (
                  <div
                    className="fixed inset-0 bg-black/30 -z-10"
                    onClick={() => {
                      setSheetCollapsed(true)
                      setActiveId(null)
                    }}
                  />
                )}
                <Card
                  className={`border-t rounded-t-3xl shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out bg-card text-card-foreground ${
                    sheetCollapsed
                      ? "translate-y-[calc(100%-4rem)]"
                      : "translate-y-0"
                  }`}
                >
                  <div
                    className="flex flex-col items-center pt-2 pb-3 px-4 cursor-pointer active:cursor-grabbing touch-none bg-card"
                    onClick={() => setSheetCollapsed((val) => !val)}
                  >
                    <div className="w-12 h-1.5 bg-border rounded-full mb-3 opacity-50" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {activeWatermark.type === "text" ? (
                          <Type className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold truncate">
                          {activeWatermark.type === "text"
                            ? activeWatermark.text || "Text Watermark"
                            : "Image Watermark"}
                        </span>
                        {sheetCollapsed && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            Tap to expand
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveId(null)
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {!sheetCollapsed && (
                    <CardContent className="pt-0">
                      {renderControlsContent(activeWatermark, true)}
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Desktop floating popup */}
          {!isMobile &&
            (() => {
              const wmEl = wmRefs.current[activeWatermark.id]
              if (!wmEl) return null

              const rect = wmEl.getBoundingClientRect()
              const popupWidth = 320
              const popupHeight = 420
              const viewportWidth = window.innerWidth
              const viewportHeight = window.innerHeight
              const spacing = 10

              let left = rect.right + spacing
              let top = rect.top + rect.height / 2 - popupHeight / 2

              if (left + popupWidth > viewportWidth - spacing) {
                left = rect.left - popupWidth - spacing
              }
              if (left < spacing) {
                left = Math.max(
                  spacing,
                  Math.min(viewportWidth - popupWidth - spacing, rect.left)
                )
                top = rect.bottom + spacing
              }
              top = Math.max(
                spacing,
                Math.min(viewportHeight - popupHeight - spacing, top)
              )

              return (
                <Card
                  id="watermark-popup"
                  className="fixed z-50 w-80 shadow-lg"
                  style={{ left, top }}
                >
                  <div className="flex justify-end p-2">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      aria-label="Close watermark controls"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent>
                    {renderControlsContent(activeWatermark, false)}
                  </CardContent>
                </Card>
              )
            })()}
        </>
      )}

      {/* Hidden span for measuring text (used in drag clamping) */}
      <span
        ref={textMeasureRef}
        className="fixed -left-[9999px] top-0 whitespace-nowrap pointer-events-none select-none"
        style={{
          visibility: "hidden",
          fontSize: `${TEXT_BASE_FONT_SIZE * displayScale}px`,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontWeight: "bold",
        }}
      />
    </div>
  )
}
