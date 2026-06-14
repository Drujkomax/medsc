"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import UserManagement from "@/features/admin/pages/UserManagement";

export default function AdminUserManagementPage() {
  return (
    <ProtectedRoute permission="manage_users" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <UserManagement />
    </ProtectedRoute>
  );
}
