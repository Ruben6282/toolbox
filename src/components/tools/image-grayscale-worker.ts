// image-grayscale-worker.ts

export {};

const ALLOWED_GRAYSCALE_TYPES = [
  "luminance",
  "average",
  "red",
  "green",
  "blue",
  "desaturate",
] as const;

type GrayscaleType = (typeof ALLOWED_GRAYSCALE_TYPES)[number];

interface WorkerMessageIn {
  jobId: number;
  width: number;
  height: number;
  pixels: ArrayBuffer;
  grayscaleType: GrayscaleType;
  contrast: number;
  brightness: number;
}

interface WorkerMessageOut {
  jobId: number;
  width: number;
  height: number;
  pixels: ArrayBuffer;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

self.onmessage = (event: MessageEvent<WorkerMessageIn>) => {
  const { jobId, width, height, pixels, grayscaleType, contrast, brightness } =
    event.data;

  try {
    const data = new Uint8ClampedArray(pixels);

    const safeContrast = clamp(contrast, 0, 3);
    const safeBrightness = clamp(brightness, -100, 100);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      let gray: number;

      switch (grayscaleType) {
        case "luminance":
          gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          break;
        case "average":
          gray = Math.round((r + g + b) / 3);
          break;
        case "red":
          gray = r;
          break;
        case "green":
          gray = g;
          break;
        case "blue":
          gray = b;
          break;
        case "desaturate": {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          gray = Math.round((max + min) / 2);
          break;
        }
        default:
          gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }

      // Apply contrast and brightness
      gray = Math.round(gray * safeContrast + safeBrightness);
      gray = clamp(gray, 0, 255);

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
      data[i + 3] = a; // alpha unchanged
    }

    const out: WorkerMessageOut = {
      jobId,
      width,
      height,
      pixels: data.buffer,
    };

    (self as unknown as Worker).postMessage(out, [data.buffer]);

  } catch (err) {
    console.error("Grayscale worker error:", err);
    // If needed you could post an error message back here
  }
};
