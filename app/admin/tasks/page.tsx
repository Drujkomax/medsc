"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRouteAdmin";
import TasksPage from "@/features/crm/pages/TasksPage";

export default function AdminTasksPagePage() {
  return (
    <ProtectedRoute permission={["view_tasks", "manage_tasks"]} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
      <TasksPage />
    </ProtectedRoute>
  );
}
