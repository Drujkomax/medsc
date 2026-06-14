"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import Categories from "@/features/admin/pages/Categories";

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute permission={["view_categories", "manage_categories"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <Categories />
    </ProtectedRoute>
  );
}
