import type { MetadataRoute } from "next";

const LOGO = "/images/logo-icon.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Med Service Centre — медицинское оборудование",
    short_name: "Med Service Centre",
    description:
      "Поставка, сервис и аренда медицинского оборудования в Узбекистане.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0C1139",
    lang: "ru",
    icons: [
      { src: LOGO, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: LOGO, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: LOGO, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
