import "../src/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Med Service Centre — Медтехника для клиник Узбекистана",
  description:
    "Med Service Centre — поставщик медоборудования в Узбекистане: УЗИ, анализаторы, электроскальпели, продажа, сервис и аренда для клиник.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
