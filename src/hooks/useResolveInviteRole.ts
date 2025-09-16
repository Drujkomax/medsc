import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Автоматически назначает роль пользователю по активному приглашению,
 * если пользователь вошёл, но его текущая роль = 'user'.
 * Возвращает состояние resolving: true во время попытки назначения, чтобы можно было показать спиннер.
 */
export const useResolveInviteRole = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [resolving, setResolving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (done) return;
      if (!user || !user.email) return;
      // Только если у пользователя базовая роль 'user' — пробуем подтянуть приглашение
      if (role && role !== 'user') return;

      try {
        setResolving(true);
        // Ищем активное приглашение по email
        const { data: invite, error: inviteError } = await supabase
          .from('user_invites')
          .select('id, email, used, expires_at')
          .eq('email', user.email)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (inviteError) {
          console.warn('Не удалось получить приглашение:', inviteError);
          setResolving(false);
          return;
        }

        if (!invite) {
          setResolving(false);
          setDone(true);
          return; // активных приглашений нет
        }

        // Применяем приглашение: назначаем роль и помечаем как использованное
        const { data: assignData, error: assignError } = await supabase.rpc('assign_role_from_invite', {
          p_invite_id: invite.id,
          p_user_id: user.id,
        });

        if (assignError) {
          console.error('Ошибка назначения роли по приглашению:', assignError);
          setResolving(false);
          setDone(true);
          return;
        }

        console.info('Роль назначена по приглашению:', assignData);
        setDone(true);
        // Обновляем приложение, чтобы хук useUserRole заново подтянул роль
        window.location.reload();
      } catch (e) {
        console.error('Исключение при назначении роли по приглашению:', e);
      } finally {
        setResolving(false);
      }
    };

    run();
  }, [user, role, done]);

  return { resolving };
};
