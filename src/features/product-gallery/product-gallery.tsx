"use client";
// Product image gallery (FSD: features/product-gallery).
// Big selected image + clickable thumbnails. Receives ready-to-use absolute urls.
import { useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const pics = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (pics.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-2xl border border-border bg-muted text-5xl text-muted-foreground">
        ⚕
      </div>
    );
  }

  const current = pics[Math.min(active, pics.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>

      {pics.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {pics.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} — ${i + 1}`}
              aria-current={i === active}
              className={`aspect-square overflow-hidden rounded-xl border bg-muted transition ${
                i === active
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-primary"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
