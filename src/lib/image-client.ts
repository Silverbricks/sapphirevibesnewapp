/**
 * Browser-only image helpers (Canvas API — no dependency).
 * Import ONLY from client components. Handles optimise→WebP, dimensions,
 * dominant colour, blur score and a perceptual average-hash for dupe detection.
 */

export interface ImageAnalysis {
  blob: Blob; // optimised WebP
  width: number;
  height: number;
  bytes: number;
  dominantColor: string;
  blurScore: number; // higher = sharper
  hash: string; // 16-hex average hash
  originalBytes: number;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

export async function readDimensions(file: Blob): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

function drawScaled(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/webp", quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), type, quality);
  });
}

function dominantColorOf(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 24; c.height = 24;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 24, 24);
  const { data } = ctx.getImageData(0, 0, 24, 24);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue; // skip transparent
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return "#cccccc";
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function blurScoreOf(img: HTMLImageElement): number {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, S, S);
  const { data } = ctx.getImageData(0, 0, S, S);
  const gray = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  // Laplacian variance
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - S] - gray[i + S];
      sum += lap; sumSq += lap * lap; count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean; // variance
}

function averageHashOf(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 8;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 8, 8);
  const { data } = ctx.getImageData(0, 0, 8, 8);
  const g: number[] = [];
  for (let i = 0; i < 64; i++) g.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  const mean = g.reduce((a, b) => a + b, 0) / 64;
  let bits = "";
  for (let i = 0; i < 64; i++) bits += g[i] >= mean ? "1" : "0";
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

/** Full analyse + optimise pass used on upload. */
export async function analyzeAndOptimize(file: File, maxDim = 2000, quality = 0.82): Promise<ImageAnalysis> {
  const img = await loadImage(file);
  const canvas = drawScaled(img, maxDim);
  const blob = await canvasToBlob(canvas, "image/webp", quality);
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
    dominantColor: dominantColorOf(img),
    blurScore: Math.round(blurScoreOf(img)),
    hash: averageHashOf(img),
    originalBytes: file.size,
  };
}

/** Hamming distance between two average hashes (0 = identical). */
export function hashDistance(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

export const humanBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
