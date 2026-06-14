"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import { Warehouse } from "@/features/admin/pages/Warehouse";

export default function AdminWarehousePage() {
  return (
    <ProtectedRoute permission={["view_products", "manage_products"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <Warehouse />
    </ProtectedRoute>
  );
}
