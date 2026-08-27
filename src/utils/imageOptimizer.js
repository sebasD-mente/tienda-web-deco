/**
 * Client-Side Image Optimizer for Deco Vintage Guate
 * Converts any JPG/PNG/WebP/AVIF file into optimized WebP data URLs
 * with smart dimension scaling and compression in pure browser Canvas.
 */

export async function optimizeImageFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const originalSizeKB = (file.size / 1024).toFixed(1);
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // 1. Generate Full Version (Max 1000px on largest side, quality 0.82)
          const fullResult = resizeToWebP(img, 1000, 0.82);

          // 2. Generate Thumb Version (Max 380px on largest side, quality 0.75)
          const thumbResult = resizeToWebP(img, 380, 0.75);

          resolve({
            fullDataUrl: fullResult.dataUrl,
            thumbDataUrl: thumbResult.dataUrl,
            originalWidth,
            originalHeight,
            originalSizeKB: `${originalSizeKB} KB`,
            optimizedWidth: fullResult.width,
            optimizedHeight: fullResult.height,
            fileName: file.name
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen para procesar.'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

function resizeToWebP(img, maxDimension, quality = 0.85) {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Scale proportionally while maintaining aspect ratio
  if (width > height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height >= width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first; if browser doesn't support WebP export, falls back to JPEG
  let dataUrl = canvas.toDataURL('image/webp', quality);
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return {
    dataUrl,
    width,
    height
  };
}
