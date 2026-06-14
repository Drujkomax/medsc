"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AdminProducts from "@/features/products/pages/AdminProducts";

export default function AdminAdminProductsPage() {
  return (
    <ProtectedRoute permission={["view_products", "manage_products"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AdminProducts />
    </ProtectedRoute>
  );
}
