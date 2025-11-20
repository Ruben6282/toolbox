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
import { Download, Type, Image as ImageIcon, Trash2, Copy } from "lucide-react"

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

// Safety cap for internal canvas size (prevents iOS Safari crashes)
const MAX_SAFE_CANVAS_DIM = 4096

// Logical base sizing for watermark drawing (canvas pixel space)
const TEXT_BASE_FONT_SIZE = 32 // px
const TEXT_MIN_LOGICAL_WIDTH = 120 // px (fallback for very short text)
const LOGO_BASE_SIZE = 128 // px square

type Watermark = {
  id: string
  type: "text" | "image"
  text?: string
  src?: string
  x: number // canvas coordinates
  y: number // canvas coordinates
  scale: number
  rotation: number // degrees
  opacity: number // 0–100
  color?: string
}

type ImageDims = {
  width: number
  height: number
}

/**
 * Detect image format via magic bytes (file signature).
 * Prevents MIME spoofing attacks.
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

    // GIF: GIF87a or GIF89a
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

// Font string used both for drawing & measuring text
const getCanvasFont = () =>
  `bold ${TEXT_BASE_FONT_SIZE}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

// Base logo size from natural width/height, preserving aspect ratio
function getLogoBaseSize(img: HTMLImageElement): { baseW: number; baseH: number } {
  const aspect = img.width / img.height || 1
  let baseW = LOGO_BASE_SIZE
  let baseH = LOGO_BASE_SIZE

  if (aspect > 1) {
    baseH = baseW / aspect
  } else {
    baseW = baseH * aspect
  }
  return { baseW, baseH }
}

// Compute rotated bounding box half-size for a watermark (for clamping)
function getWatermarkHalfSize(
  wm: Watermark,
  ctx: CanvasRenderingContext2D,
  logoImages: Record<string, HTMLImageElement | null>
): { halfWidth: number; halfHeight: number } {
  let width = TEXT_MIN_LOGICAL_WIDTH
  let height = TEXT_BASE_FONT_SIZE * 1.2

  if (wm.type === "text") {
    const text = wm.text ?? ""
    ctx.save()
    ctx.font = getCanvasFont()
    const metrics = ctx.measureText(text || "A")
    const measuredWidth = metrics.width || TEXT_MIN_LOGICAL_WIDTH
    ctx.restore()

    width = Math.max(TEXT_MIN_LOGICAL_WIDTH, measuredWidth)
    height = TEXT_BASE_FONT_SIZE * 1.2
  } else {
    const logo = logoImages[wm.id]
    if (logo && logo.width > 0 && logo.height > 0) {
      const { baseW, baseH } = getLogoBaseSize(logo)
      width = baseW
      height = baseH
    } else {
      width = LOGO_BASE_SIZE
      height = LOGO_BASE_SIZE
    }
  }

  const ws = width * wm.scale
  const hs = height * wm.scale

  const theta = (wm.rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const rotatedW = Math.abs(ws * cos) + Math.abs(hs * sin)
  const rotatedH = Math.abs(ws * sin) + Math.abs(hs * cos)

  return {
    halfWidth: rotatedW / 2,
    halfHeight: rotatedH / 2,
  }
}

// Unrotated logical (scaled) half-size for hit-testing
function getWatermarkLogicalHalfSize(
  wm: Watermark,
  ctx: CanvasRenderingContext2D,
  logoImages: Record<string, HTMLImageElement | null>
): { halfWidth: number; halfHeight: number } {
  let width = TEXT_MIN_LOGICAL_WIDTH
  let height = TEXT_BASE_FONT_SIZE * 1.2

  if (wm.type === "text") {
    const text = wm.text ?? ""
    ctx.save()
    ctx.font = getCanvasFont()
    const metrics = ctx.measureText(text || "A")
    const measuredWidth = metrics.width || TEXT_MIN_LOGICAL_WIDTH
    ctx.restore()

    width = Math.max(TEXT_MIN_LOGICAL_WIDTH, measuredWidth)
    height = TEXT_BASE_FONT_SIZE * 1.2
  } else {
    const logo = logoImages[wm.id]
    if (logo && logo.width > 0 && logo.height > 0) {
      const { baseW, baseH } = getLogoBaseSize(logo)
      width = baseW
      height = baseH
    } else {
      width = LOGO_BASE_SIZE
      height = LOGO_BASE_SIZE
    }
  }

  const ws = width * wm.scale
  const hs = height * wm.scale

  return {
    halfWidth: ws / 2,
    halfHeight: hs / 2,
  }
}

export const AddWatermark = () => {
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<ImageDims | null>(null)

  const [watermarks, setWatermarks] = useState<Watermark[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const [displayScale, setDisplayScale] = useState(1)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const baseImageRef = useRef<HTMLImageElement | null>(null)
  const logoImagesRef = useRef<Record<string, HTMLImageElement | null>>({})
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null)

  const prevBaseUrlRef = useRef<string | null>(null)
  const logoBlobUrlsRef = useRef<string[]>([])

  const { createImageUrl } = useObjectUrls()

  const activeWatermark = activeId
    ? watermarks.find((w) => w.id === activeId) || null
    : null

  // Revoke base image URL and logo URLs on unmount (snapshot refs at mount)
  useEffect(() => {
    const initialBaseUrl = prevBaseUrlRef.current
    const initialLogoUrlsSnapshot = logoBlobUrlsRef.current.slice()

    return () => {
      if (initialBaseUrl && initialBaseUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(initialBaseUrl)
        } catch {
          // ignore
        }
      }

      for (const url of initialLogoUrlsSnapshot) {
        if (url && url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url)
          } catch {
            // ignore
          }
        }
      }
    }
  }, [])

  // Compute displayScale so canvas fits nicely in the card
  useEffect(() => {
    if (!imageDims) return

    const computeScale = () => {
      if (typeof window === "undefined") return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const containerWidth =
        containerRef.current?.clientWidth ?? Math.max(320, viewportWidth - 32)

      const maxEditorHeight = Math.max(200, viewportHeight - 260)

      const scaleByWidth = containerWidth / imageDims.width
      const scaleByHeight = maxEditorHeight / imageDims.height

      const scale = Math.min(scaleByWidth, scaleByHeight, 1)
      setDisplayScale(scale > 0 && Number.isFinite(scale) ? scale : 1)
    }

    computeScale()
    window.addEventListener("resize", computeScale)
    return () => window.removeEventListener("resize", computeScale)
  }, [imageDims])

  // Helper: convert client coords -> canvas coords (internal pixel space)
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
  }, [])

  // Ensure canvas internal size matches imageDims once when dims change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageDims) return

    canvas.width = imageDims.width
    canvas.height = imageDims.height
  }, [imageDims])

  // Core drawing routine – can be used for preview or export
  const drawSceneInternal = useCallback(
    (showSelectionOutline: boolean) => {
      const canvas = canvasRef.current
      const baseImg = baseImageRef.current
      if (!canvas || !baseImg || !imageDims) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Draw base image scaled to current canvas size
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)

      let activeWM: Watermark | null = null

      for (const wm of watermarks) {
        ctx.save()
        ctx.globalAlpha = wm.opacity / 100

        ctx.translate(wm.x, wm.y)
        ctx.rotate((wm.rotation * Math.PI) / 180)
        ctx.scale(wm.scale, wm.scale)

        if (wm.type === "text" && wm.text) {
          ctx.font = getCanvasFont()
          ctx.fillStyle = wm.color || "#000000"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(wm.text, 0, 0)
        } else if (wm.type === "image" && wm.src) {
          const logo = logoImagesRef.current[wm.id]
          if (logo && logo.width > 0 && logo.height > 0) {
            const { baseW, baseH } = getLogoBaseSize(logo)
            ctx.drawImage(logo, -baseW / 2, -baseH / 2, baseW, baseH)
          }
        }

        ctx.restore()

        if (activeId === wm.id) {
          activeWM = wm
        }
      }

      // Draw selection outline for the active watermark (preview only)
      if (showSelectionOutline && activeWM) {
        ctx.save()

        const { halfWidth, halfHeight } = getWatermarkHalfSize(
          activeWM,
          ctx,
          logoImagesRef.current
        )

        ctx.translate(activeWM.x, activeWM.y)
        ctx.rotate((activeWM.rotation * Math.PI) / 180)

        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = "rgba(59,130,246,0.9)" // Tailwind primary-ish

        ctx.strokeRect(-halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2)

        ctx.restore()
      }
    },
    [activeId, imageDims, watermarks]
  )

  // Draw preview scene whenever dependencies change
  const drawScenePreview = useCallback(() => {
    drawSceneInternal(true)
  }, [drawSceneInternal])

  useEffect(() => {
    drawScenePreview()
  }, [drawScenePreview])

  // Global pointer move / up for dragging – throttled with requestAnimationFrame
  useEffect(() => {
    if (!draggingId || !imageDims) return

    let frameId: number | null = null

    const handlePointerMove = (e: PointerEvent) => {
      if (frameId !== null) return

      frameId = window.requestAnimationFrame(() => {
        frameId = null

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const coords = getCanvasCoords(e.clientX, e.clientY)
        if (!coords) return
        const { x, y } = coords

        const last = lastCanvasPosRef.current
        if (!last) {
          lastCanvasPosRef.current = { x, y }
          return
        }

        const dx = x - last.x
        const dy = y - last.y

        setWatermarks((prev) =>
          prev.map((wm) => {
            if (wm.id !== draggingId) return wm

            const { halfWidth, halfHeight } = getWatermarkHalfSize(
              wm,
              ctx,
              logoImagesRef.current
            )

            let newX = wm.x + dx
            let newY = wm.y + dy

            newX = Math.max(
              halfWidth,
              Math.min(imageDims.width - halfWidth, newX)
            )
            newY = Math.max(
              halfHeight,
              Math.min(imageDims.height - halfHeight, newY)
            )

            return { ...wm, x: newX, y: newY }
          })
        )

        lastCanvasPosRef.current = { x, y }
      })
    }

    const handlePointerUp = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
      setDraggingId(null)
      lastCanvasPosRef.current = null
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [draggingId, imageDims, getCanvasCoords])

  // Upload base image
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`)
      e.target.value = ""
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error(
        "Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed."
      )
      e.target.value = ""
      return
    }

    const sniffed = await sniffMime(file)
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.")
      e.target.value = ""
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
      e.target.value = ""
      return
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    })

    if (!url) {
      notify.error("Failed to create image URL.")
      e.target.value = ""
      return
    }

    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      // Apply safety cap for internal canvas resolution
      const scale = Math.min(
        1,
        MAX_SAFE_CANVAS_DIM / img.width,
        MAX_SAFE_CANVAS_DIM / img.height
      )

      const internalWidth = Math.round(img.width * scale)
      const internalHeight = Math.round(img.height * scale)

      baseImageRef.current = img
      setImageDims({ width: internalWidth, height: internalHeight })
      setBaseImageUrl(url)
      setWatermarks([])
      setActiveId(null)
      logoImagesRef.current = {}

      if (prevBaseUrlRef.current && prevBaseUrlRef.current !== url) {
        if (prevBaseUrlRef.current.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(prevBaseUrlRef.current)
          } catch {
            // ignore
          }
        }
      }
      prevBaseUrlRef.current = url

      notify.success("Image uploaded successfully!")
    }
    img.onerror = () => {
      notify.error("Failed to read image dimensions.")
    }
    img.src = url

    // Allow re-selecting the same file
    e.target.value = ""
  }

  // Upload logo for watermark
  const handleLogoUpload = async (
    id: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify.error(`Logo size exceeds ${MAX_FILE_SIZE_MB}MB limit.`)
      e.target.value = ""
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify.error(
        "Invalid file type. Only PNG, JPEG, WebP, GIF, and BMP are allowed."
      )
      e.target.value = ""
      return
    }

    const sniffed = await sniffMime(file)
    if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
      notify.error("File signature mismatch. File may be corrupted or spoofed.")
      e.target.value = ""
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
      e.target.value = ""
      return
    }

    const url = await createImageUrl(file, {
      downscaleLarge: true,
      maxDimension: MAX_IMAGE_DIMENSION,
    })
    if (!url) {
      notify.error("Failed to load logo.")
      e.target.value = ""
      return
    }

    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      logoImagesRef.current[id] = img

      // Track blob URL for cleanup on unmount
      if (url.startsWith("blob:")) {
        logoBlobUrlsRef.current.push(url)
      }

      // Revoke old logo URL if it was a blob
      setWatermarks((prev) =>
        prev.map((wm) => {
          if (wm.id !== id) return wm
          if (wm.src && wm.src !== url && wm.src.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(wm.src)
            } catch {
              // ignore
            }
          }
          return { ...wm, src: url }
        })
      )

      notify.success("Logo uploaded successfully!")
    }
    img.onerror = () => {
      notify.error("Failed to load logo image.")
    }
    img.src = url

    // Allow re-selecting the same file
    e.target.value = ""
  }

  // Toolbar actions
  const addWatermark = (type: "text" | "image") => {
    if (!imageDims) {
      notify.error("Upload an image first.")
      return
    }

    if (watermarks.length >= MAX_WATERMARKS) {
      notify.error(`Maximum of ${MAX_WATERMARKS} watermarks reached.`)
      return
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

    const newWM: Watermark = {
      id,
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
    notify.success(`${type === "text" ? "Text" : "Image"} watermark added!`)
  }

  const removeAll = () => {
    if (watermarks.length === 0) {
      notify.error("No watermarks to remove.")
      return
    }

    // Revoke all blob URLs for watermark logos immediately
    watermarks.forEach((wm) => {
      if (wm.src && wm.src.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(wm.src)
        } catch {
          // ignore
        }
      }
    })

    setWatermarks([])
    setActiveId(null)
    logoImagesRef.current = {}
    notify.success("All watermarks removed!")
  }

  const updateWatermark = (id: string, changes: Partial<Watermark>) => {
    setWatermarks((prev) =>
      prev.map((wm) => (wm.id === id ? { ...wm, ...changes } : wm))
    )
  }

  const duplicateWatermark = (wm: Watermark) => {
    if (!imageDims) return
    if (watermarks.length >= MAX_WATERMARKS) {
      notify.error(`Maximum of ${MAX_WATERMARKS} watermarks reached.`)
      return
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

    const clone: Watermark = {
      ...wm,
      id,
      x: Math.min(wm.x + 20, imageDims.width - 10),
      y: Math.min(wm.y + 20, imageDims.height - 10),
    }

    setWatermarks((prev) => [...prev, clone])

    // Reuse same logo image reference if it's an image watermark
    if (wm.type === "image") {
      const existingLogo = logoImagesRef.current[wm.id]
      if (existingLogo) {
        logoImagesRef.current[clone.id] = existingLogo
      }
    }

    notify.success("Watermark duplicated!")
  }

  const deleteWatermark = (id: string) => {
    setWatermarks((prev) => {
      const target = prev.find((w) => w.id === id)
      if (target?.src && target.src.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.src)
        } catch {
          // ignore
        }
      }
      return prev.filter((w) => w.id !== id)
    })

    if (logoImagesRef.current[id]) {
      delete logoImagesRef.current[id]
    }
    setActiveId((current) => (current === id ? null : current))
    notify.success("Watermark deleted!")
  }

  // Canvas pointer down: hit-test and start dragging if hit (rotation-aware)
  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!imageDims) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const coords = getCanvasCoords(e.clientX, e.clientY)
    if (!coords) return

    const { x, y } = coords

    let hitId: string | null = null

    // Check from topmost watermark (last drawn) to bottom
    for (let i = watermarks.length - 1; i >= 0; i -= 1) {
      const wm = watermarks[i]

      // Rotate pointer into watermark's local space
      const dx = x - wm.x
      const dy = y - wm.y
      const theta = (-wm.rotation * Math.PI) / 180
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      const localX = dx * cos - dy * sin
      const localY = dx * sin + dy * cos

      const { halfWidth, halfHeight } = getWatermarkLogicalHalfSize(
        wm,
        ctx,
        logoImagesRef.current
      )

      if (
        Math.abs(localX) <= halfWidth &&
        Math.abs(localY) <= halfHeight
      ) {
        hitId = wm.id
        break
      }
    }

    if (hitId) {
      setActiveId(hitId)
      setDraggingId(hitId)
      lastCanvasPosRef.current = { x, y }
      e.preventDefault()
    } else {
      setActiveId(null)
    }
  }

  // Export: redraw scene at full resolution and download
  const generateFinalImage = () => {
    if (!canvasRef.current || !imageDims || !baseImageRef.current) {
      notify.error("No image to export.")
      return
    }

    if (!canvasRef.current.toBlob) {
      notify.error("Your browser does not support image export.")
      return
    }

    // Draw without selection outline
    drawSceneInternal(false)

    canvasRef.current.toBlob(
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

          // Safari-friendly pattern
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setTimeout(() => {
            try {
              URL.revokeObjectURL(url)
            } catch {
              // ignore
            }
          }, 0)

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
              onClick={() => addWatermark("text")}
              className="w-full sm:w-auto"
            >
              <Type className="w-4 h-4 mr-2" />
              Add Text
            </Button>
            <Button
              onClick={() => addWatermark("image")}
              className="w-full sm:w-auto"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Logo
            </Button>
            <Button
              variant="destructive"
              onClick={removeAll}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview + canvas editor */}
      {baseImageUrl && imageDims && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={containerRef} className="w-full flex justify-center">
              <canvas
                ref={canvasRef}
                className="border border-border rounded-md bg-black/5"
                style={{
                  width: imageDims.width * displayScale,
                  height: imageDims.height * displayScale,
                  touchAction: "none",
                  maxWidth: "100%",
                  maxHeight: "80vh",
                }}
                onPointerDown={handleCanvasPointerDown}
              />
            </div>

            <div className="mt-4 flex justify-center">
              <Button
                onClick={generateFinalImage}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Watermarked Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls for selected watermark */}
      {baseImageUrl && watermarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeWatermark ? "Selected Watermark" : "Watermark Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeWatermark && (
              <p className="text-sm text-muted-foreground">
                Click on a watermark in the preview to edit its settings.
              </p>
            )}

            {activeWatermark && (
              <>
                {/* Basic type info + actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <span className="text-sm font-medium">
                    {activeWatermark.type === "text"
                      ? "Text Watermark"
                      : "Image Watermark"}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateWatermark(activeWatermark)}
                      className="w-full sm:w-auto"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWatermark(activeWatermark.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Text settings */}
                {activeWatermark.type === "text" && (
                  <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
                    <div className="space-y-2">
                      <Label>Text</Label>
                      <Textarea
                        rows={2}
                        value={activeWatermark.text ?? ""}
                        onChange={(e) => {
                          const sanitized = truncateText(
                            // remove HTML and collapse whitespace into single spaces
                            stripHtml(e.target.value).replace(/\s+/g, " "),
                            200
                          ).trim()
                          updateWatermark(activeWatermark.id, {
                            text: sanitized,
                          })
                        }}
                        className="resize-none text-sm"
                        placeholder="Enter watermark text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={activeWatermark.color ?? "#000000"}
                          onChange={(e) => {
                            const value = e.target.value
                            // enforce #RRGGBB pattern
                            if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return
                            updateWatermark(activeWatermark.id, {
                              color: value,
                            })
                          }}
                          className="h-10 w-20 p-1 cursor-pointer"
                        />
                        <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border">
                          {activeWatermark.color ?? "#000000"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logo upload if needed */}
                {activeWatermark.type === "image" && !activeWatermark.src && (
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                    <Label>Upload Logo</Label>
                    <Input
                      key={activeWatermark.id}
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={(e) => handleLogoUpload(activeWatermark.id, e)}
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG with transparency is recommended for best results.
                    </p>
                  </div>
                )}

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {activeWatermark.opacity}%
                    </span>
                  </div>
                  <Slider
                    value={[activeWatermark.opacity]}
                    onValueChange={(v) =>
                      updateWatermark(activeWatermark.id, {
                        opacity: v[0] ?? activeWatermark.opacity,
                      })
                    }
                    min={10}
                    max={100}
                  />
                </div>

                {/* Scale */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scale</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {activeWatermark.scale.toFixed(2)}x
                    </span>
                  </div>
                  <Slider
                    value={[activeWatermark.scale]}
                    onValueChange={(v) =>
                      updateWatermark(activeWatermark.id, {
                        scale: v[0] ?? activeWatermark.scale,
                      })
                    }
                    min={0.2}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rotation</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {activeWatermark.rotation}°
                    </span>
                  </div>
                  <Slider
                    value={[activeWatermark.rotation]}
                    onValueChange={(v) =>
                      updateWatermark(activeWatermark.id, {
                        rotation: v[0] ?? activeWatermark.rotation,
                      })
                    }
                    min={-180}
                    max={180}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
