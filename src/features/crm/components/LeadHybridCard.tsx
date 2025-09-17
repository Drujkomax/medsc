import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lead } from '@/hooks/useLeads';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { DuplicateAlert } from './DuplicateAlert';
import { Eye, Edit, Archive, MoreVertical, Phone, Building2, Calendar, User, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface LeadHybridCardProps {
  lead: Lead;
  allLeads: Lead[];
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onArchive: (id: string) => void;
  onStageChange: (id: string, stage: string) => void;
  onCreateDeal?: (lead: Lead) => void;
}

const stages = [
  { value: 'new', label: 'Новый', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Связались', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Квалифицирован', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Предложение', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Переговоры', color: 'bg-indigo-500' },
  { value: 'closed', label: 'Закрыт', color: 'bg-green-500' },
  { value: 'lost', label: 'Потерян', color: 'bg-red-500' },
];

export const LeadHybridCard = ({ 
  lead, 
  allLeads, 
  onView, 
  onEdit, 
  onArchive, 
  onStageChange,
  onCreateDeal
}: LeadHybridCardProps) => {
  const { getDuplicatesForLead } = useDuplicateDetection(allLeads);
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  const duplicates = getDuplicatesForLead(lead.id);
  const currentStage = stages.find(s => s.value === lead.stage);
  
  const canEdit = hasPermission('manage_all_leads') || 
                 (hasPermission('view_all_leads') && lead.assigned_to === user?.id);
  
  const canArchive = hasPermission('manage_all_leads');

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {duplicates.length > 0 && !showDuplicates && (
        <div className="mb-3">
          <DuplicateAlert 
            duplicateGroup={{
              leads: [lead, ...duplicates],
              duplicateType: 'name', // simplified for display
              score: 85
            }}
            onViewDuplicates={() => setShowDuplicates(!showDuplicates)}
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">{lead.name}</h3>
            
            {/* Status Selector */}
            <Select 
              value={lead.stage} 
              onValueChange={(value) => onStageChange(lead.id, value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-auto h-7 text-xs bg-white border">
                <SelectValue>
                  {currentStage?.label || 'Статус'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-blue-600" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-green-600" />
                <span>{lead.company}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span>{new Date(lead.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            {lead.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-purple-600" />
                <span>Назначен</span>
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(lead)}>
              <Eye className="h-4 w-4 mr-2" />
              Просмотр
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
            )}
            {onCreateDeal && hasPermission('manage_all_leads') && (
              <DropdownMenuItem onClick={() => onCreateDeal(lead)}>
                <DollarSign className="h-4 w-4 mr-2" />
                Создать сделку
              </DropdownMenuItem>
            )}
            {canArchive && (
              <DropdownMenuItem onClick={() => onArchive(lead.id)}>
                <Archive className="h-4 w-4 mr-2" />
                Архивировать
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {lead.notes && (
        <p className="text-sm text-gray-600 truncate">{lead.notes}</p>
      )}

      {showDuplicates && duplicates.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-2 text-gray-900">Похожие лиды:</h4>
          <div className="space-y-1">
            {duplicates.map(dup => (
              <div key={dup.id} className="text-xs p-2 bg-orange-50 border border-orange-200 rounded">
                <div className="font-medium text-gray-900">{dup.name}</div>
                {dup.phone && <div className="text-gray-600">{dup.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

    </Card>
  );
};