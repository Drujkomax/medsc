import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "~/admin/admin-shell";

// The admin panel must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Админка — Med Service Centre",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
