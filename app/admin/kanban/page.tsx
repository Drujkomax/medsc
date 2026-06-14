"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AdminKanban from "@/features/admin/pages/AdminKanban";

export default function AdminAdminKanbanPage() {
  return (
    <ProtectedRoute permission="view_kanban" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AdminKanban />
    </ProtectedRoute>
  );
}
