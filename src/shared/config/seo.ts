// Shared SEO helpers (FSD: shared/config). Keeps Open Graph / Twitter cards
// consistent across every public page.
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "./site";

// Default social image. The asset is 770×820 — declare the REAL dimensions
// (the previous 1200×630 declaration did not match the file).
export const OG_IMAGE_URL = `${SITE_URL}/images/og-image.png`;
export const OG_IMAGE = { url: OG_IMAGE_URL, width: 770, height: 820, alt: SITE_NAME };

/** Consistent Open Graph + Twitter metadata for a public page. */
export function socialMeta(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = opts.imageUrl
    ? { url: opts.imageUrl, alt: opts.imageAlt || opts.title }
    : OG_IMAGE;
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.url,
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image.url],
    },
  };
}
