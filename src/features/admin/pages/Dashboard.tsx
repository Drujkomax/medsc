import RoleBasedDashboard from "../components/Dashboard/RoleBasedDashboard";
import MonitoringDashboard from "@/components/admin/MonitoringDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { hasPermission } = useUserPermissions();
  const { t } = useTranslation();

  const canViewMonitoring = hasPermission("view_analytics");

  return (
    <div className="space-y-6">
      {canViewMonitoring ? (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">{t("dashboard.executive.tabs.mainPanel", "Основная панель")}</TabsTrigger>
            <TabsTrigger value="monitoring">
              {t("dashboard.executive.tabs.systemMonitoring", "Мониторинг системы")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <RoleBasedDashboard />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringDashboard />
          </TabsContent>
        </Tabs>
      ) : (
        <RoleBasedDashboard />
      )}
    </div>
  );
};

export default Dashboard;
