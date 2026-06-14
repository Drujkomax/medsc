"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import EditProduct from "@/features/products/pages/EditProduct";

export default function AdminEditProductPage() {
  return (
    <ProtectedRoute permission="manage_products" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <EditProduct />
    </ProtectedRoute>
  );
}
