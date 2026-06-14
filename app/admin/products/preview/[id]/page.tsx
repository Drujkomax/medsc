"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AdminProductPreview from "@/features/products/pages/AdminProductPreview";

export default function AdminAdminProductPreviewPage() {
  return (
    <ProtectedRoute permission={["view_products", "manage_products"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AdminProductPreview />
    </ProtectedRoute>
  );
}
