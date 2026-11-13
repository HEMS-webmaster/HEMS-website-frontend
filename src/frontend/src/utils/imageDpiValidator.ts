import { DpiDetectionSource, MIN_GRAPHIC_DPI } from "@/types/abstractSubmission";

export const MAX_GRAPHIC_BYTES = 15 * 1024 * 1024; // 15 MB limit for high-res 300+ DPI graphics
const PRINT_COLUMN_WIDTH_INCHES = 3.0;
const MIN_PIXEL_WIDTH_WITH_METADATA = 600;
const MIN_PIXEL_HEIGHT = 300;

export interface ValidatedGraphicResult {
  ok: boolean;
  error?: string;
  widthPx: number;
  heightPx: number;
  detectedDpi: number;
  embeddedDpi: number | null;
  effectivePrintDpi: number;
  dpiSource: DpiDetectionSource;
  previewUrl: string;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let out = "";
  const end = Math.min(offset + length, view.byteLength);
  for (let i = offset; i < end; i++) {
    out += String.fromCharCode(view.getUint8(i));
  }
  return out;
}

function parsePngDpi(buffer: ArrayBuffer): number | null {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 33) return null;
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (view.getUint32(0, false) !== 0x89504e47 || view.getUint32(4, false) !== 0x0d0a1a0a) {
      return null;
    }

    let offset = 8;
    while (offset + 8 <= view.byteLength) {
      const length = view.getUint32(offset, false);
      const chunkType = readAscii(view, offset + 4, 4);
      const dataStart = offset + 8;

      if (chunkType === "pHYs" && length >= 9 && dataStart + 9 <= view.byteLength) {
        const ppuX = view.getUint32(dataStart, false);
        const ppuY = view.getUint32(dataStart + 4, false);
        const unit = view.getUint8(dataStart + 8);
        if (unit === 1 && ppuX > 0 && ppuY > 0) {
          return Math.round(Math.min(ppuX, ppuY) * 0.0254);
        }
        return null;
      }

      if (chunkType === "IEND" || dataStart + length + 4 > view.byteLength) {
        break;
      }
      offset = dataStart + length + 4;
    }
    return null;
  } catch {
    return null;
  }
}

function parseExifTiffDpi(view: DataView, tiffOffset: number): number | null {
  if (tiffOffset + 8 > view.byteLength) return null;
  const endianSig = readAscii(view, tiffOffset, 2);
  const littleEndian = endianSig === "II";
  if (!littleEndian && endianSig !== "MM") return null;

  const magic = view.getUint16(tiffOffset + 2, littleEndian);
  if (magic !== 42) return null;

  const ifd0Offset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
  if (ifd0Offset + 2 > view.byteLength) return null;

  const entryCount = view.getUint16(ifd0Offset, littleEndian);
  let xRes: number | null = null;
  let yRes: number | null = null;
  let unit = 2; // EXIF default = inches

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const fieldType = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if ((tag === 0x011a || tag === 0x011b) && fieldType === 5 && count >= 1) {
      const valueOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
      if (valueOffset + 8 <= view.byteLength) {
        const num = view.getUint32(valueOffset, littleEndian);
        const den = view.getUint32(valueOffset + 4, littleEndian);
        if (den > 0) {
          const val = num / den;
          if (tag === 0x011a) xRes = val;
          else yRes = val;
        }
      }
    } else if (tag === 0x0128 && fieldType === 3) {
      unit = view.getUint16(entryOffset + 8, littleEndian);
    }
  }

  const chosen =
    xRes !== null && yRes !== null
      ? Math.min(xRes, yRes)
      : xRes ?? yRes;
  if (chosen === null || chosen <= 0) return null;
  if (unit === 3) return Math.round(chosen * 2.54); // cm -> inch
  if (unit === 2) return Math.round(chosen); // inch
  return null;
}

function parseJpegDpi(buffer: ArrayBuffer): number | null {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return null;
    }

    let jfifDpi: number | null = null;
    let exifDpi: number | null = null;
    let offset = 2;

    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) {
        offset++;
        continue;
      }
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffda || marker === 0xffd9) break; // SOS or EOI
      if (marker === 0xff01 || (marker >= 0xffd0 && marker <= 0xffd7)) continue;
      if (offset + 2 > view.byteLength) break;

      const segmentLength = view.getUint16(offset, false);
      const dataStart = offset + 2;
      if (segmentLength < 2 || offset + segmentLength > view.byteLength) break;

      if (
        marker === 0xffe0 &&
        segmentLength >= 14 &&
        readAscii(view, dataStart, 5) === "JFIF\0"
      ) {
        const units = view.getUint8(dataStart + 7);
        const xDensity = view.getUint16(dataStart + 8, false);
        const yDensity = view.getUint16(dataStart + 10, false);
        const minDensity = Math.min(xDensity, yDensity);
        if (units === 1 && minDensity > 0) {
          jfifDpi = Math.round(minDensity);
        } else if (units === 2 && minDensity > 0) {
          jfifDpi = Math.round(minDensity * 2.54);
        }
      } else if (
        marker === 0xffe1 &&
        segmentLength >= 16 &&
        readAscii(view, dataStart, 6) === "Exif\0\0"
      ) {
        exifDpi = parseExifTiffDpi(view, dataStart + 6);
      }

      offset += segmentLength;
    }

    return exifDpi ?? jfifDpi;
  } catch {
    return null;
  }
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
    };
    img.onerror = () => {
      reject(new Error("The selected image file could not be decoded by the browser."));
    };
    img.src = url;
  });
}

export async function validateImageDpi(
  file: File,
  minDpi: number = MIN_GRAPHIC_DPI
): Promise<ValidatedGraphicResult> {
  const lowerName = file.name.toLowerCase();
  const isSvg = file.type === "image/svg+xml" || lowerName.endsWith(".svg");
  const isPng = file.type === "image/png" || lowerName.endsWith(".png");
  const isJpeg =
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg");
  const isWebp = file.type === "image/webp" || lowerName.endsWith(".webp");

  if (!isSvg && !isPng && !isJpeg && !isWebp) {
    return {
      ok: false,
      error: "Please upload a high-resolution PNG, JPEG, WebP, or vector SVG figure.",
      widthPx: 0,
      heightPx: 0,
      detectedDpi: 0,
      embeddedDpi: null,
      effectivePrintDpi: 0,
      dpiSource: "effective",
      previewUrl: "",
    };
  }

  if (file.size > MAX_GRAPHIC_BYTES) {
    return {
      ok: false,
      error: "Graphic file exceeds the 15 MB maximum upload limit.",
      widthPx: 0,
      heightPx: 0,
      detectedDpi: 0,
      embeddedDpi: null,
      effectivePrintDpi: 0,
      dpiSource: "effective",
      previewUrl: "",
    };
  }

  if (isSvg) {
    try {
      const svgText = await file.text();
      if (/<script[\s>]/i.test(svgText) || /\son[a-z]+\s*=/i.test(svgText)) {
        return {
          ok: false,
          error: "SVG rejected: embedded scripts or inline event handlers are not permitted.",
          widthPx: 0,
          heightPx: 0,
          detectedDpi: 0,
          embeddedDpi: null,
          effectivePrintDpi: 0,
          dpiSource: "vector",
          previewUrl: "",
        };
      }
    } catch {
      return {
        ok: false,
        error: "Unable to read the selected SVG file.",
        widthPx: 0,
        heightPx: 0,
        detectedDpi: 0,
        embeddedDpi: null,
        effectivePrintDpi: 0,
        dpiSource: "vector",
        previewUrl: "",
      };
    }

    const previewUrl = URL.createObjectURL(file);
    try {
      const dims = await loadImageDimensions(previewUrl);
      return {
        ok: true,
        widthPx: dims.width || 1200,
        heightPx: dims.height || 800,
        detectedDpi: 600,
        embeddedDpi: null,
        effectivePrintDpi: 600,
        dpiSource: "vector",
        previewUrl,
      };
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Invalid SVG graphic.",
        widthPx: 0,
        heightPx: 0,
        detectedDpi: 0,
        embeddedDpi: null,
        effectivePrintDpi: 0,
        dpiSource: "vector",
        previewUrl: "",
      };
    }
  }

  let embeddedDpi: number | null = null;
  try {
    const buffer = await file.arrayBuffer();
    if (isPng) embeddedDpi = parsePngDpi(buffer);
    else if (isJpeg) embeddedDpi = parseJpegDpi(buffer);
  } catch {
    embeddedDpi = null;
  }

  const previewUrl = URL.createObjectURL(file);
  try {
    const dims = await loadImageDimensions(previewUrl);
    const widthPx = dims.width;
    const heightPx = dims.height;

    if (widthPx <= 0 || heightPx <= 0) {
      URL.revokeObjectURL(previewUrl);
      return {
        ok: false,
        error: "Unable to read pixel dimensions from the selected image.",
        widthPx: 0,
        heightPx: 0,
        detectedDpi: 0,
        embeddedDpi,
        effectivePrintDpi: 0,
        dpiSource: "effective",
        previewUrl: "",
      };
    }

    const effectivePrintDpi = Math.round(widthPx / PRINT_COLUMN_WIDTH_INCHES);
    const metadataPass =
      embeddedDpi !== null &&
      embeddedDpi >= minDpi &&
      widthPx >= MIN_PIXEL_WIDTH_WITH_METADATA &&
      heightPx >= MIN_PIXEL_HEIGHT;
    const effectivePass =
      effectivePrintDpi >= minDpi && heightPx >= MIN_PIXEL_HEIGHT;

    if (!metadataPass && !effectivePass) {
      URL.revokeObjectURL(previewUrl);
      return {
        ok: false,
        error: `Graphic resolution is below the ${minDpi} DPI minimum (${
          embeddedDpi ? `${embeddedDpi} DPI metadata, ` : ""
        }${widthPx}×${heightPx} px ≈ ${effectivePrintDpi} DPI at 3" print width). Please upload a 300+ DPI image (at least 900 px wide, or 600+ px wide with 300 DPI metadata).`,
        widthPx,
        heightPx,
        detectedDpi: embeddedDpi ?? effectivePrintDpi,
        embeddedDpi,
        effectivePrintDpi,
        dpiSource: embeddedDpi ? "metadata" : "effective",
        previewUrl: "",
      };
    }

    if (embeddedDpi !== null && embeddedDpi >= minDpi && metadataPass) {
      return {
        ok: true,
        widthPx,
        heightPx,
        detectedDpi: embeddedDpi,
        embeddedDpi,
        effectivePrintDpi,
        dpiSource: "metadata",
        previewUrl,
      };
    }

    return {
      ok: true,
      widthPx,
      heightPx,
      detectedDpi: effectivePrintDpi,
      embeddedDpi,
      effectivePrintDpi,
      dpiSource: "effective",
      previewUrl,
    };
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to inspect uploaded graphic.",
      widthPx: 0,
      heightPx: 0,
      detectedDpi: 0,
      embeddedDpi,
      effectivePrintDpi: 0,
      dpiSource: "effective",
      previewUrl: "",
    };
  }
}
