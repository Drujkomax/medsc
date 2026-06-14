"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AdminServices from "@/features/admin/pages/AdminServices";

export default function AdminAdminServicesPage() {
  return (
    <ProtectedRoute permission={["view_services", "manage_services"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AdminServices />
    </ProtectedRoute>
  );
}
