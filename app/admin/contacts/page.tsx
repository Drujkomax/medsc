"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import AdminContacts from "@/features/admin/pages/AdminContacts";

export default function AdminAdminContactsPage() {
  return (
    <ProtectedRoute permission={["view_contacts", "manage_contacts"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <AdminContacts />
    </ProtectedRoute>
  );
}
