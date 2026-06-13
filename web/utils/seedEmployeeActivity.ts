import { supabase } from '@/integrations/supabase/client';

// Генерируем тестовые данные для демонстрации системы
export const seedEmployeeActivity = async (userId: string, userEmail: string) => {
  const activities = [
    {
      action_type: 'login',
      details: { user_email: userEmail, session_start: new Date().toISOString() },
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 дней назад
    },
    {
      action_type: 'product_edit',
      entity_type: 'product',
      details: { product_name: 'МРТ сканер Siemens', action: 'updated_price' },
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(), // 6 дней назад
    },
    {
      action_type: 'lead_update',
      entity_type: 'lead',
      details: { lead_name: 'ООО Медицинский центр', old_stage: 'new', new_stage: 'contacted' },
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 дней назад
    },
    {
      action_type: 'login',
      details: { user_email: userEmail, session_start: new Date().toISOString() },
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 дней назад
    },
    {
      action_type: 'product_create',
      entity_type: 'product',
      details: { product_name: 'Аппарат УЗИ GE Healthcare', category: 'diagnostic' },
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 дня назад
    },
    {
      action_type: 'deal_action',
      entity_type: 'deal',
      details: { deal_title: 'Поставка оборудования в клинику Аспект', amount: 150000 },
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 дня назад
    },
    {
      action_type: 'page_view',
      details: { page: '/admin/analytics', duration: 300 },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 дня назад
    },
    {
      action_type: 'login',
      details: { user_email: userEmail, session_start: new Date().toISOString() },
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(), // вчера
    },
    {
      action_type: 'lead_create',
      entity_type: 'lead',
      details: { lead_name: 'Медицинский центр Здоровье', phone: '+998901234567', company: 'ООО Здоровье' },
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(), // вчера
    },
    {
      action_type: 'form_submit',
      details: { form_name: 'contact_form', client_name: 'Иванов И.И.' },
      created_at: new Date(Date.now() - 43200000).toISOString(), // 12 часов назад
    },
    {
      action_type: 'login',
      details: { user_email: userEmail, session_start: new Date().toISOString() },
      created_at: new Date(Date.now() - 3600000).toISOString(), // час назад
    },
    {
      action_type: 'product_edit',
      entity_type: 'product',
      details: { product_name: 'Рентген аппарат Canon', action: 'updated_description' },
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 минут назад
    }
  ];

  for (const activity of activities) {
    try {
      await supabase.from('employee_activity').insert({
        user_id: userId,
        action_type: activity.action_type,
        entity_type: activity.entity_type || null,
        details: activity.details,
        date: activity.created_at.split('T')[0],
        created_at: activity.created_at,
      });
    } catch (error) {
      console.error('Error inserting activity:', error);
    }
  }
};