"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import ArchivedData from "@/features/admin/pages/ArchivedData";

export default function AdminArchivedDataPage() {
  return (
    <ProtectedRoute permission="view_archive" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <ArchivedData />
    </ProtectedRoute>
  );
}
