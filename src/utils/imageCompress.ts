/**
 * Client-side canvas image compressor for Firebase Spark Plan (no Cloud Storage required).
 * Resizes images to fit within maxDim x maxDim and steps down quality until <= maxBytes (~45 KB).
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDim = 400,
  maxBytes = 45_000
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image file'));
      el.src = objectUrl;
    });

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // White fill prevents black background artifacts when converting PNG to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const mimeCandidates = ['image/webp', 'image/jpeg'];
    const qualities = [0.82, 0.72, 0.6, 0.48, 0.36];

    let bestResult = '';
    for (const mime of mimeCandidates) {
      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL(mime, quality);
        if (!bestResult || dataUrl.length < bestResult.length) {
          bestResult = dataUrl;
        }
        // Approximate decoded byte size from base64 length (~0.75x)
        const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
        if (approxBytes <= maxBytes) {
          return dataUrl;
        }
      }
    }

    return bestResult;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
