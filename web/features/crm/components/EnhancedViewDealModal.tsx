import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Deal } from '@/types/crm';
import { useLeads } from '@/hooks/useLeads';
import { useUserRole } from '@/hooks/useUserRole';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import DealAuditLog from './DealAuditLog';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  User, 
  FileText, 
  Edit,
  Clock,
  Building2,
  Mail,
  Phone,
  Target,
  BarChart3,
  Activity,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface EnhancedViewDealModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  onEdit?: (deal: Deal) => void;
}

const EnhancedViewDealModal = ({ open, onClose, deal, onEdit }: EnhancedViewDealModalProps) => {
  const { t } = useTranslation();
  const { leads } = useLeads();
  const { role } = useUserRole();

  if (!deal) return null;

  const getLeadDetails = (leadId?: string) => {
    if (!leadId) return null;
    return leads.find(l => l.id === leadId);
  };

  const getStageColor = (stage: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      proposal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[stage as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-muted-foreground';
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTimeUntilClose = (closeDate: string) => {
    const now = new Date();
    const close = new Date(closeDate);
    const isOverdue = close < now;
    
    return {
      distance: formatDistanceToNow(close, { locale: ru, addSuffix: !isOverdue }),
      isOverdue,
      daysLeft: Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const calculateEstimatedValue = () => {
    if (!deal.amount || !deal.probability) return 0;
    return deal.amount * (deal.probability / 100);
  };

  const getPaymentStatusInfo = (status?: string) => {
    const statusMap = {
      'waiting': { label: t('deals.payment.waiting', 'Ожидание'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      'paid': { label: t('deals.payment.paid', 'Оплачено'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: DollarSign },
      'not_realized': { label: t('deals.payment.notRealized', 'Не реализовано'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: FileText },
      'debt': { label: t('deals.payment.debt', 'Задолженность'), color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap['waiting'];
  };

  const leadDetails = getLeadDetails(deal.lead_id);
  const estimatedValue = calculateEstimatedValue();
  const timeInfo = deal.close_date ? getTimeUntilClose(deal.close_date) : null;
  const paymentStatusInfo = getPaymentStatusInfo(deal.payment_status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <span className="text-xl font-semibold">{deal.title}</span>
            </div>
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(deal)}>
                <Edit className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t('deals.overview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={`${getStageColor(deal.stage)} text-sm px-3 py-1`}>
                    {t(`deals.stages.${deal.stage}`)}
                  </Badge>
                  {deal.amount && (
                    <div className="flex items-center text-2xl font-bold">
                      <DollarSign className="w-6 h-6 mr-1" />
                      {deal.amount.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Probability Progress */}
                {deal.probability && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('deals.probability')}</span>
                      <span className={`text-sm font-bold ${getProbabilityColor(deal.probability)}`}>
                        {deal.probability}%
                      </span>
                    </div>
                    <Progress value={deal.probability} className="h-3" />
                  </div>
                )}

                {/* Estimated Value */}
                {estimatedValue > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('deals.estimatedValue')}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ${estimatedValue.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                {deal.payment_status && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t('deals.paymentStatus', 'Статус оплаты')}</span>
                      </div>
                      <Badge className={paymentStatusInfo.color}>
                        {paymentStatusInfo.label}
                      </Badge>
                    </div>
                    {deal.payment_status === 'debt' && deal.debt_amount && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-900 dark:text-red-200">{t('deals.debtAmount', 'Сумма задолженности')}</span>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          ${deal.debt_amount.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {leadDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {t('deals.clientInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg font-semibold">
                        {leadDetails.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{leadDetails.name}</h3>
                      {leadDetails.company && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-1">
                          <Building2 className="w-4 h-4" />
                          <span>{leadDetails.company}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {leadDetails.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{leadDetails.email}</span>
                          </div>
                        )}
                        {leadDetails.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{leadDetails.phone}</span>
                          </div>
                        )}
                      </div>
                      {leadDetails.notes && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">{leadDetails.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {deal.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('deals.notes')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{deal.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline & Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('deals.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.close_date && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('deals.closeDate')}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {format(new Date(deal.close_date), 'dd.MM.yyyy')}
                        </div>
                        {timeInfo && (
                          <div className={`text-xs ${timeInfo.isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {timeInfo.isOverdue ? t('deals.overdueBy', 'Просрочено на') : t('deals.remaining', 'Осталось')} {timeInfo.distance}
                          </div>
                        )}
                      </div>
                    </div>
                    {timeInfo && !timeInfo.isOverdue && (
                      <Progress value={Math.max(0, Math.min(100, 100 - (timeInfo.daysLeft / 30) * 100))} className="h-2" />
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{t('deals.created')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(deal.created_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{t('deals.lastUpdated')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(deal.updated_at), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>

                  {deal.stage === 'closed' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm">{t('deals.closed')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(deal.updated_at), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('deals.quickStats')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{formatDistanceToNow(new Date(deal.created_at), { locale: ru })}</div>
                    <div className="text-xs text-muted-foreground">{t('deals.ageInSystem')}</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{deal.stage}</div>
                    <div className="text-xs text-muted-foreground">{t('deals.currentStage')}</div>
                  </div>
                </div>

                {deal.amount && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('deals.amount')}</span>
                      <span className="font-medium">${deal.amount.toLocaleString()}</span>
                    </div>
                    
                    {deal.probability && (
                      <div className="flex justify-between text-sm">
                        <span>{t('deals.probability')}</span>
                        <span className="font-medium">{deal.probability}%</span>
                      </div>
                    )}
                    
                    {estimatedValue > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="font-medium">{t('deals.estimatedValue')}</span>
                        <span className="font-bold text-green-600">${estimatedValue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('common.actions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onEdit && (
                  <Button onClick={() => onEdit(deal)} className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  {t('deals.viewHistory')}
                </Button>
                
                {leadDetails && (
                  <Button variant="outline" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    {t('deals.viewClient')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Audit Log - Only for Accountants */}
          {role === 'accountant' && (
            <div className="col-span-2">
              <DealAuditLog dealId={deal.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedViewDealModal;