"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import ActivityLogs from "@/features/admin/pages/ActivityLogs";

export default function AdminActivityLogsPage() {
  return (
    <ProtectedRoute permission="view_activity_logs" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <ActivityLogs />
    </ProtectedRoute>
  );
}
