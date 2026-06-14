"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import DealsPage from "@/features/crm/pages/DealsPage";

export default function AdminDealsPagePage() {
  return (
    <ProtectedRoute permission={["view_deals", "manage_deals"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <DealsPage />
    </ProtectedRoute>
  );
}
