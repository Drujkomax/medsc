import { HelmetProvider } from "react-helmet-async";
import "./i18n/config";
import App from "./App";

// Mirrors the old main.tsx bootstrap (i18n init + HelmetProvider) for the Next mount.
export default function Root() {
  return (
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
