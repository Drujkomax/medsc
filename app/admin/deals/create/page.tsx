"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import CreateDeal from "@/features/crm/pages/CreateDeal";

export default function AdminCreateDealPage() {
  return (
    <ProtectedRoute permission="manage_deals" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <CreateDeal />
    </ProtectedRoute>
  );
}
