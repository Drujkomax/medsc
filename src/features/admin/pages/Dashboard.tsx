import RoleBasedDashboard from '../components/Dashboard/RoleBasedDashboard';
import MonitoringDashboard from '@/components/admin/MonitoringDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const Dashboard = () => {
  const { hasPermission } = useUserPermissions();
  
  // Только директора и админы могут видеть мониторинг
  const canViewMonitoring = hasPermission('view_analytics');

  return (
    <div className="space-y-6">
      {canViewMonitoring ? (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Основная панель</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг системы</TabsTrigger>
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