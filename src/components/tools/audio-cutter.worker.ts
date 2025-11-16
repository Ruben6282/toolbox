// audio-cutter.worker.ts
export {};

type CutRequest = {
  type: "CUT";
  sampleRate: number;
  numChannels: number;
  length: number; // number of frames (samples per channel)
  channelData: ArrayBuffer[]; // one buffer per channel (Float32Array)
};

type ProgressMessage = {
  type: "PROGRESS";
  value: number; // 0–100
};

type CutCompleteMessage = {
  type: "CUT_COMPLETE";
  wavBuffer: ArrayBuffer;
  duration: number;
};

type ErrorMessage = {
  type: "ERROR";
  message: string;
};

type WorkerMessage = CutRequest;
type WorkerResponse = ProgressMessage | CutCompleteMessage | ErrorMessage;

// Helper: write ASCII string into DataView
const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

onmessage = (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;

  if (data.type !== "CUT") return;

  try {
    const { sampleRate, numChannels, length, channelData } = data;

    if (
      numChannels <= 0 ||
      !Number.isFinite(sampleRate) ||
      sampleRate <= 0 ||
      length <= 0
    ) {
      const errorMsg: ErrorMessage = {
        type: "ERROR",
        message: "Invalid audio metadata for cutting.",
      };
      postMessage(errorMsg);
      return;
    }

    if (!Array.isArray(channelData) || channelData.length !== numChannels) {
      const errorMsg: ErrorMessage = {
        type: "ERROR",
        message: "Channel data mismatch.",
      };
      postMessage(errorMsg);
      return;
    }

    const channels: Float32Array[] = channelData.map(
      (buf) => new Float32Array(buf)
    );

    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = length * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true); // file size - 8
    writeString(view, 8, "WAVE");

    // fmt chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // PCM header size
    view.setUint16(20, 1, true); // format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Interleave samples
    let offset = 44;
    let lastReported = -1;

    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channel = channels[ch];
        let sample = channel[i] ?? 0;
        // clamp
        if (sample > 1) sample = 1;
        else if (sample < -1) sample = -1;

        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }

      // Throttle progress updates
      if (i % 8192 === 0 || i === length - 1) {
        const progress = Math.round((i / (length - 1 || 1)) * 100);
        if (progress !== lastReported) {
          const msg: ProgressMessage = { type: "PROGRESS", value: progress };
          postMessage(msg);
          lastReported = progress;
        }
      }
    }

    const duration = length / sampleRate;

    const completeMsg: CutCompleteMessage = {
      type: "CUT_COMPLETE",
      wavBuffer: buffer,
      duration,
    };

    // Transfer WAV buffer back to main thread
    // @ts-expect-error - TS doesn't know postMessage's transfer list here
    postMessage(completeMsg, [buffer]);
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message)
        : "Unknown error while cutting audio.";

    const errorMsg: ErrorMessage = {
      type: "ERROR",
      message,
    };
    postMessage(errorMsg);
  }
};
