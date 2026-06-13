"use client";
import dynamic from "next/dynamic";

// The full real app (i18n + HelmetProvider + BrowserRouter) mounted client-side — design 1:1.
const Root = dynamic(() => import("@/Root"), { ssr: false });

export default function ClientApp() {
  return <Root />;
}
