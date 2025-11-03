import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*, profiles!inner(telegram_id)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!notifications || notifications.length === 0) {
      console.log('No pending notifications');
      return new Response(JSON.stringify({ processed: 0, message: 'No notifications to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const notification of notifications) {
      const telegramId = notification.profiles?.telegram_id;
      
      if (!telegramId) {
        console.log(`Skipping notification ${notification.id} - user has no Telegram linked`);
        await supabase
          .from('notification_queue')
          .update({ status: 'failed', error: 'No Telegram ID' })
          .eq('id', notification.id);
        failed++;
        continue;
      }

      try {
        // Send message via Telegram Bot API
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: notification.message,
            parse_mode: 'HTML',
          }),
        });

        if (response.ok) {
          await supabase
            .from('notification_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          processed++;
          console.log(`Notification ${notification.id} sent to ${telegramId}`);
        } else {
          const errorData = await response.json();
          console.error(`Failed to send notification ${notification.id}:`, errorData);
          await supabase
            .from('notification_queue')
            .update({ status: 'failed', error: JSON.stringify(errorData) })
            .eq('id', notification.id);
          failed++;
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        await supabase
          .from('notification_queue')
          .update({ status: 'failed', error: error.message })
          .eq('id', notification.id);
        failed++;
      }
    }

    console.log(`Processed ${processed} notifications, ${failed} failed`);

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-notifications:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
