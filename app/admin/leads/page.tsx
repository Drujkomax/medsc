"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import Leads from "@/features/crm/pages/Leads";

export default function AdminLeadsPage() {
  return (
    <ProtectedRoute permission="view_all_leads" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <Leads />
    </ProtectedRoute>
  );
}
