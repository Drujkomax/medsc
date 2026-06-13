"use client";
import dynamic from "next/dynamic";

// The full real msc-heal-hub app (i18n + HelmetProvider + BrowserRouter) mounted client-side — design 1:1.
const Root = dynamic(() => import("@/Root"), { ssr: false });

export default function CatchAll() {
  return <Root />;
}
