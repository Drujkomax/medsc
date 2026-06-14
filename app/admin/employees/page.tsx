"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import EmployeeManagement from "@/features/admin/pages/EmployeeManagement";

export default function AdminEmployeeManagementPage() {
  return (
    <ProtectedRoute permission="manage_users" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <EmployeeManagement />
    </ProtectedRoute>
  );
}
