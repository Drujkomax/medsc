"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AddProduct from "@/features/products/pages/AddProduct";

export default function AdminAddProductPage() {
  return (
    <ProtectedRoute permission="manage_products" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AddProduct />
    </ProtectedRoute>
  );
}
