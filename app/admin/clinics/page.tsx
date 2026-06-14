"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import Clinics from "@/features/admin/pages/Clinics";

export default function AdminClinicsPage() {
  return (
    <ProtectedRoute permission={["view_products", "manage_products"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <Clinics />
    </ProtectedRoute>
  );
}
