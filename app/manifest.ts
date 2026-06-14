import type { MetadataRoute } from "next";

const LOGO = "/lovable-uploads/acdce942-978c-4243-9068-38f2c5bb0284.png";

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
      { src: LOGO, sizes: "any", type: "image/png" },
      { src: LOGO, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
