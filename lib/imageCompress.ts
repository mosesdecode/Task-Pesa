/**
 * Client-side image compression and safe API response parser
 * Prevents Vercel 4.5MB serverless payload limit (HTTP 413 Request Entity Too Large)
 */

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<File> {
  // If not an image, or GIF, or already tiny (< 150KB), don't touch it
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 150 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // Compression did not reduce size; keep original
            } else {
              const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
              const compressedFile = new File([blob], compressedName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Safely parses API responses to prevent `Unexpected token 'R'` when proxies return plain text 413 or 500
 */
export async function parseApiResponse(res: Response, fallbackError = 'Request failed') {
  if (res.status === 413) {
    throw new Error(
      'The uploaded image is too large for the server (exceeds Vercel 4.5MB limit). Please upload a compressed image or link.'
    );
  }

  const rawText = await res.text();
  let data: any = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    if (!res.ok) {
      throw new Error(
        rawText?.length > 0 && rawText.length < 200
          ? rawText
          : `${fallbackError} (Status: ${res.status})`
      );
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || fallbackError);
  }

  return data;
}
