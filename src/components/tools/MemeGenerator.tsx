/** FULLY FIXED PRODUCTION-READY, MOBILE-FRIENDLY MEME GENERATOR */
import { useState, useRef, useEffect, useCallback } from "react"
import type {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Type,
} from "lucide-react"

import { notify } from "@/lib/notify"
import {
  ALLOWED_IMAGE_TYPES,
  stripHtml,
  truncateText,
  MAX_IMAGE_DIMENSION,
  validateImageFile,
  sniffMime,
} from "@/lib/security"
import { useObjectUrls } from "@/hooks/use-object-urls"

const MAX_FILE_SIZE_MB = 10
const MAX_TEXT_BOXES = 50
const MAX_TEXT_LENGTH = 120

const DEFAULT_FONT_SIZE = 48
const DEFAULT_STROKE_WIDTH = 3
const DEFAULT_ROTATION = 0

const FONT_FAMILIES = [
  "Impact",
  "Arial",
  "Comic Sans MS",
  "Verdana",
  "Courier New",
  "Georgia",
  "Times New Roman",
] as const

type FontFamily = (typeof FONT_FAMILIES)[number]

type TextLayer = {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  stroke: string
  strokeWidth: number
  rotation: number
  fontFamily: FontFamily
}

type ImageDims = {
  width: number
  height: number
}

type SniffResult = { valid: boolean; detected?: string | null } | null

// Ensure font family is allowed
const coerceFontFamily = (val: string): FontFamily =>
  FONT_FAMILIES.includes(val as FontFamily) ? (val as FontFamily) : "Impact"

const DEFAULT_TEXT_STYLE: Pick<
  TextLayer,
  "fontSize" | "color" | "stroke" | "strokeWidth" | "rotation" | "fontFamily"
> = {
  fontSize: DEFAULT_FONT_SIZE,
  color: "#ffffff",
  stroke: "#000000",
  strokeWidth: DEFAULT_STROKE_WIDTH,
  rotation: DEFAULT_ROTATION,
  fontFamily: "Impact",
}

const getCanvasFont = (fontSize: number, fontFamily: string) =>
  `bold ${fontSize}px ${fontFamily}, Impact, Arial, sans-serif`

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
) {
  const cleanText = (text || "").toUpperCase()
  const words = cleanText.split(/\s+/).filter(Boolean)

  const lines: string[] = []
  let line = ""
  let maxLineWidth = 0

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && line) {
      lines.push(line)
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width)
      line = word
    } else {
      line = testLine
    }
  }

  if (line) {
    lines.push(line)
    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width)
  }

  const lineHeight = fontSize * 1.2

  return { lines, lineHeight, maxLineWidth }
}

function getTextLayerHalfSize(
  layer: TextLayer,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number
) {
  const maxWidth = canvasWidth * 0.9

  ctx.save()
  ctx.font = getCanvasFont(layer.fontSize, layer.fontFamily)
  const { lines, lineHeight, maxLineWidth } = getWrappedLines(
    ctx,
    layer.text,
    maxWidth,
    layer.fontSize
  )
  ctx.restore()

  const width = maxLineWidth
  const height = lineHeight * lines.length

  const rad = (layer.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    halfWidth: (Math.abs(width * cos) + Math.abs(height * sin)) / 2,
    halfHeight: (Math.abs(width * sin) + Math.abs(height * cos)) / 2,
  }
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  canvasWidth: number
) {
  const maxWidth = canvasWidth * 0.9
  ctx.font = getCanvasFont(layer.fontSize, layer.fontFamily)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = layer.color
  ctx.strokeStyle = layer.stroke
  ctx.lineWidth = layer.strokeWidth

  const { lines, lineHeight } = getWrappedLines(
    ctx,
    layer.text,
    maxWidth,
    layer.fontSize
  )

  const totalHeight = lineHeight * lines.length
  const startY = -totalHeight / 2 + lineHeight / 2

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight
    if (layer.strokeWidth > 0) ctx.strokeText(lines[i], 0, y)
    ctx.fillText(lines[i], 0, y)
  }
}

export const MemeGenerator = () => {
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<ImageDims | null>(null)

  const [textLayers, setTextLayers] = useState<TextLayer[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const [displayScale, setDisplayScale] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const baseImageRef = useRef<HTMLImageElement | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null)
  const prevBaseUrlRef = useRef<string | null>(null)
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  const { createImageUrl, revoke } = useObjectUrls()

  const announce = (msg: string) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = msg
  }

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (prevBaseUrlRef.current) {
        try {
          revoke(prevBaseUrlRef.current)
        } catch {
          // best-effort cleanup
        }
      }
    }
  }, [revoke])

  // -------------------------- SCALE LOGIC --------------------------

  useEffect(() => {
    if (!imageDims) return

    const compute = () => {
      if (typeof window === "undefined") return

      const containerWidth =
        containerRef.current?.clientWidth ?? Math.max(window.innerWidth - 32, 320)

      const maxEditorHeight = Math.max(window.innerHeight - 260, 200)

      const scaleByWidth = containerWidth / imageDims.width
      const scaleByHeight = maxEditorHeight / imageDims.height
      const scale = Math.min(scaleByWidth, scaleByHeight, 1)

      setDisplayScale(scale > 0 && Number.isFinite(scale) ? scale : 1)
    }

    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [imageDims])

  // ------------------------------ DRAW ------------------------------

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current
    const base = baseImageRef.current
    if (!canvas || !base || !imageDims) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = imageDims.width
    canvas.height = imageDims.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height)

    for (const layer of textLayers) {
      if (!layer.text) continue
      ctx.save()
      ctx.translate(layer.x, layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      drawTextLayer(ctx, layer, canvas.width)
      ctx.restore()
    }
  }, [imageDims, textLayers])

  useEffect(() => {
    drawScene()
  }, [drawScene])

  // ---------------------- POINTER DRAG LOGIC ------------------------

  const getCanvasCoords = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    const x = ((cx - rect.left) / rect.width) * canvas.width
    const y = ((cy - rect.top) / rect.height) * canvas.height
    return { x, y }
  }, [])

  useEffect(() => {
    if (!draggingId || !imageDims) return

    const move = (e: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const pos = getCanvasCoords(e.clientX, e.clientY)
      if (!pos) return

      const last = lastCanvasPosRef.current
      if (!last) {
        lastCanvasPosRef.current = pos
        return
      }

      const dx = pos.x - last.x
      const dy = pos.y - last.y

      setTextLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== draggingId) return layer
          const { halfWidth, halfHeight } = getTextLayerHalfSize(
            layer,
            ctx,
            canvas.width
          )

          const nx = Math.max(
            halfWidth,
            Math.min(imageDims.width - halfWidth, layer.x + dx)
          )
          const ny = Math.max(
            halfHeight,
            Math.min(imageDims.height - halfHeight, layer.y + dy)
          )

          return { ...layer, x: nx, y: ny }
        })
      )

      lastCanvasPosRef.current = pos
    }

    const up = () => {
      setDraggingId(null)
      lastCanvasPosRef.current = null
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)

    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
  }, [draggingId, imageDims, getCanvasCoords])

  // -------------------------- UPLOAD IMAGE --------------------------

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const msg = `File size exceeds ${MAX_FILE_SIZE_MB}MB`
      notify.error(msg)
      announce(msg)
      return
    }

    const typeError = validateImageFile(file)
    if (typeError) {
      notify.error(typeError)
      announce(typeError)
      return
    }

    try {
      const sig = (await sniffMime(file)) as SniffResult
      if (!sig || ("valid" in sig && !sig.valid)) {
        const msg = "Invalid or corrupted image file"
        notify.error(msg)
        announce(msg)
        return
      }
    } catch {
      const msg = "Failed to inspect image file"
      notify.error(msg)
      announce(msg)
      return
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    })

    if (!url) {
      const msg = "Failed to create image URL"
      notify.error(msg)
      announce(msg)
      return
    }

    const img = new Image()
    img.decoding = "async"

    img.onload = () => {
      baseImageRef.current = img
      setImageDims({ width: img.width, height: img.height })
      setBaseImageUrl(url)
      setTextLayers([])
      setActiveId(null)

      if (prevBaseUrlRef.current && prevBaseUrlRef.current !== url) {
        try {
          revoke(prevBaseUrlRef.current)
        } catch {
          // ignore
        }
      }
      prevBaseUrlRef.current = url

      notify.success("Image uploaded!")
      announce("Image uploaded")
    }

    img.onerror = () => {
      const msg = "Failed to load image"
      notify.error(msg)
      announce(msg)
    }

    img.src = url
  }

  // ---------------------- TEXT LAYER ACTIONS ------------------------

  const addTextLayer = () => {
    if (!imageDims) {
      const msg = "Upload image first"
      notify.error(msg)
      announce(msg)
      return
    }

    if (textLayers.length >= MAX_TEXT_BOXES) {
      const msg = `Maximum of ${MAX_TEXT_BOXES} layers reached`
      notify.error(msg)
      announce(msg)
      return
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

    const layer: TextLayer = {
      id,
      text: "Your Text Here",
      x: imageDims.width / 2,
      y: imageDims.height / 2,
      ...DEFAULT_TEXT_STYLE,
    }

    setTextLayers((prev) => [...prev, layer])
    setActiveId(id)

    notify.success("Text layer added")
    announce("Text layer added")
  }

  const updateTextLayer = (id: string, changes: Partial<TextLayer>) => {
    setTextLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...changes } : layer))
    )
  }

  const deleteTextLayer = (id: string) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id))
    if (activeId === id) setActiveId(null)

    notify.success("Text layer removed")
    announce("Text layer removed")
  }

  const duplicateTextLayer = (layer: TextLayer) => {
    if (!imageDims) return
    if (textLayers.length >= MAX_TEXT_BOXES) {
      const msg = `Maximum of ${MAX_TEXT_BOXES} layers reached`
      notify.error(msg)
      announce(msg)
      return
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

    const clone: TextLayer = {
      ...layer,
      id,
      x: Math.min(layer.x + 20, imageDims.width - 10),
      y: Math.min(layer.y + 20, imageDims.height - 10),
    }

    setTextLayers((prev) => [...prev, clone])
    setActiveId(id)

    notify.success("Text duplicated")
    announce("Text duplicated")
  }

  const removeAllTextLayers = () => {
    if (textLayers.length === 0) {
      notify.error("No text layers to remove")
      announce("No text layers to remove")
      return
    }
    setTextLayers([])
    setActiveId(null)
    notify.success("All text removed")
    announce("All text removed")
  }

  // --------------------------- HIT TEST -----------------------------

  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!imageDims) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const coords = getCanvasCoords(e.clientX, e.clientY)
    if (!coords) return

    let hit: string | null = null

    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i]
      if (!layer.text) continue

      const { halfWidth, halfHeight } = getTextLayerHalfSize(
        layer,
        ctx,
        canvas.width
      )

      if (
        coords.x >= layer.x - halfWidth &&
        coords.x <= layer.x + halfWidth &&
        coords.y >= layer.y - halfHeight &&
        coords.y <= layer.y + halfHeight
      ) {
        hit = layer.id
        break
      }
    }

    if (hit) {
      setActiveId(hit)
      setDraggingId(hit)
      lastCanvasPosRef.current = coords
      e.preventDefault()
    } else {
      setActiveId(null)
    }
  }

  // --------------------------- DOWNLOAD -----------------------------

  const downloadMeme = () => {
    if (!canvasRef.current || !imageDims) {
      const msg = "Upload an image first"
      notify.error(msg)
      announce(msg)
      return
    }

    drawScene()

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          const msg = "Failed to export"
          notify.error(msg)
          announce(msg)
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `meme-${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(url)
        notify.success("Meme downloaded!")
        announce("Meme downloaded")
      },
      "image/png",
      0.92
    )
  }

  // ----------------------------- RESET ------------------------------

  const resetMeme = () => {
    if (prevBaseUrlRef.current) {
      try {
        revoke(prevBaseUrlRef.current)
      } catch {
        // ignore
      }
      prevBaseUrlRef.current = null
    }

    setBaseImageUrl(null)
    setImageDims(null)
    setTextLayers([])
    setActiveId(null)
    setDraggingId(null)
    lastCanvasPosRef.current = null

    if (fileInputRef.current) fileInputRef.current.value = ""

    notify.success("Meme reset")
    announce("Meme reset")
  }

  const activeLayer = activeId
    ? textLayers.find((l) => l.id === activeId) ?? null
    : null

  // =====================================================================
  //                                JSX
  // =====================================================================

  return (
    <div className="space-y-6 relative">
      {/* Screen reader live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Meme Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="meme-upload" className="text-sm font-medium">
            Upload Image
          </Label>
          <Input
            id="meme-upload"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF, WebP, BMP — max {MAX_FILE_SIZE_MB}MB
          </p>
        </CardContent>
      </Card>

      {/* Main content when image loaded */}
      {baseImageUrl && imageDims && (
        <div ref={containerRef} className="space-y-6">
          {/* TEXT LAYERS PANEL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Text Layers
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTextLayer}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Text
                  </Button>
                  {textLayers.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={removeAllTextLayers}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove All
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {textLayers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No text layers yet. Tap &quot;Add Text&quot; to begin!
                </p>
              ) : (
                textLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-3 ${
                      activeLayer?.id === layer.id ? "ring-1 ring-primary/70" : ""
                    }`}
                  >
                    {/* TEXT INPUT */}
                    <div className="flex gap-2 items-start">
                      <Textarea
                        value={layer.text}
                        maxLength={MAX_TEXT_LENGTH}
                        className="flex-1 min-h-[48px] text-sm resize-none"
                        onChange={(e) =>
                          updateTextLayer(layer.id, {
                            text: truncateText(
                              stripHtml(e.target.value),
                              MAX_TEXT_LENGTH
                            ),
                          })
                        }
                        onFocus={() => setActiveId(layer.id)}
                        placeholder="Enter meme text..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTextLayer(layer.id)}
                        aria-label="Delete text layer"
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {/* SETTINGS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Font size */}
                      <div>
                        <div className="flex justify-between">
                          <Label className="text-xs font-medium">
                            Font Size
                          </Label>
                          <span className="font-mono text-xs text-muted-foreground">
                            {layer.fontSize}px
                          </span>
                        </div>
                        <Slider
                          value={[layer.fontSize]}
                          onValueChange={(v) =>
                            updateTextLayer(layer.id, {
                              fontSize: v[0] ?? layer.fontSize,
                            })
                          }
                          min={20}
                          max={140}
                          step={2}
                        />
                      </div>

                      {/* Stroke width */}
                      <div>
                        <div className="flex justify-between">
                          <Label className="text-xs font-medium">
                            Stroke Width
                          </Label>
                          <span className="font-mono text-xs text-muted-foreground">
                            {layer.strokeWidth}px
                          </span>
                        </div>
                        <Slider
                          value={[layer.strokeWidth]}
                          onValueChange={(v) =>
                            updateTextLayer(layer.id, {
                              strokeWidth: v[0] ?? layer.strokeWidth,
                            })
                          }
                          min={0}
                          max={10}
                          step={1}
                        />
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="flex justify-between">
                          <Label className="text-xs font-medium">
                            Rotation
                          </Label>
                          <span className="font-mono text-xs text-muted-foreground">
                            {layer.rotation}°
                          </span>
                        </div>
                        <Slider
                          value={[layer.rotation]}
                          onValueChange={(v) =>
                            updateTextLayer(layer.id, {
                              rotation: v[0] ?? layer.rotation,
                            })
                          }
                          min={-180}
                          max={180}
                          step={5}
                        />
                      </div>

                      {/* Font Family */}
                      <div>
                        <Label className="text-xs font-medium">
                          Font Family
                        </Label>
                        <select
                          className="w-full border rounded-md h-10 px-2 bg-background text-sm"
                          value={layer.fontFamily}
                          onChange={(e) =>
                            updateTextLayer(layer.id, {
                              fontFamily: coerceFontFamily(e.target.value),
                            })
                          }
                        >
                          {FONT_FAMILIES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Text Color */}
                      <div>
                        <Label className="text-xs font-medium">Text Color</Label>
                        <Input
                          type="color"
                          value={layer.color}
                          onChange={(e) =>
                            updateTextLayer(layer.id, { color: e.target.value })
                          }
                          className="h-10 cursor-pointer"
                        />
                      </div>

                      {/* Stroke Color */}
                      <div>
                        <Label className="text-xs font-medium">
                          Stroke Color
                        </Label>
                        <Input
                          type="color"
                          value={layer.stroke}
                          onChange={(e) =>
                            updateTextLayer(layer.id, { stroke: e.target.value })
                          }
                          className="h-10 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* DUPLICATE BUTTON */}
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateTextLayer(layer)}
                      >
                        Duplicate
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* CANVAS */}
          <Card>
            <CardHeader>
              <CardTitle>Preview &amp; Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-2 sm:p-4 border rounded-lg bg-muted/30 flex justify-center items-center overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="rounded shadow cursor-move active:cursor-grabbing select-none"
                  style={{
                    width: imageDims.width * displayScale,
                    height: imageDims.height * displayScale,
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    touchAction: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  onPointerDown={handleCanvasPointerDown}
                  aria-label="Meme canvas. Drag text to reposition."
                />
              </div>

              {textLayers.length > 0 && (
                <p className="text-center text-xs text-muted-foreground px-4">
                  💡 Drag text directly on the canvas to move it (works on touch
                  and mouse).
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={downloadMeme} className="flex-1 h-12 sm:h-10">
                  <Download className="w-4 h-4 mr-2" />
                  Download Meme
                </Button>
                <Button
                  onClick={resetMeme}
                  className="flex-1 h-12 sm:h-10"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
