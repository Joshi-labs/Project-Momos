import React, { useState, useEffect } from 'react';

const transparentCache = new Map();

export default function TransparentMomoImage({ src, alt, className = '' }) {
  const [cleanSrc, setCleanSrc] = useState(() => transparentCache.get(src) || null);

  useEffect(() => {
    if (!src) return;
    if (transparentCache.has(src)) {
      setCleanSrc(transparentCache.get(src));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 512;
        const height = img.naturalHeight || img.height || 512;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Flood fill from edges to remove outer white background without touching artwork highlights
        const visited = new Uint8Array(width * height);
        const queue = [];

        const isWhite = (idx) => data[idx] > 235 && data[idx + 1] > 235 && data[idx + 2] > 235;

        for (let x = 0; x < width; x++) {
          if (isWhite(x * 4)) {
            queue.push(x);
            visited[x] = 1;
          }
          const btm = (height - 1) * width + x;
          if (isWhite(btm * 4)) {
            queue.push(btm);
            visited[btm] = 1;
          }
        }

        for (let y = 0; y < height; y++) {
          const left = y * width;
          if (!visited[left] && isWhite(left * 4)) {
            queue.push(left);
            visited[left] = 1;
          }
          const right = y * width + (width - 1);
          if (!visited[right] && isWhite(right * 4)) {
            queue.push(right);
            visited[right] = 1;
          }
        }

        let head = 0;
        while (head < queue.length) {
          const p = queue[head++];
          const px = p % width;
          const py = Math.floor(p / width);
          const idx = p * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const minVal = Math.min(r, g, b);

          if (minVal > 248) {
            data[idx + 3] = 0;
          } else {
            data[idx + 3] = Math.round(((248 - minVal) / 13) * 255);
          }

          if (px > 0 && !visited[p - 1] && isWhite((p - 1) * 4)) {
            visited[p - 1] = 1;
            queue.push(p - 1);
          }
          if (px < width - 1 && !visited[p + 1] && isWhite((p + 1) * 4)) {
            visited[p + 1] = 1;
            queue.push(p + 1);
          }
          if (py > 0 && !visited[p - width] && isWhite((p - width) * 4)) {
            visited[p - width] = 1;
            queue.push(p - width);
          }
          if (py < height - 1 && !visited[p + width] && isWhite((p + width) * 4)) {
            visited[p + width] = 1;
            queue.push(p + width);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        transparentCache.set(src, dataUrl);
        setCleanSrc(dataUrl);
      } catch (err) {
        console.error('Error removing background from image:', err);
        setCleanSrc(src);
      }
    };

    img.onerror = () => {
      setCleanSrc(src);
    };
  }, [src]);

  return (
    <img
      src={cleanSrc || src}
      alt={alt}
      className={`${className} transition-opacity duration-150 ${cleanSrc ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

