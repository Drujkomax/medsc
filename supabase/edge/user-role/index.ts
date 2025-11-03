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
    const botJwt = Deno.env.get('BOT_BACKEND_JWT');
    if (!botJwt) {
      throw new Error('BOT_BACKEND_JWT not configured');
    }

    // Verify bot authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== botJwt) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userId: string | null = null;
    let telegramId: number | null = null;

    // Support both GET and POST
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const tgIdParam = url.searchParams.get('tg_id');
      if (tgIdParam) {
        telegramId = parseInt(tgIdParam, 10);
      }
    } else if (req.method === 'POST') {
      const body = await req.json();
      userId = body.userId || null;
      // Support both telegramId and tg_id
      telegramId = body.telegramId || body.tg_id || null;
    }

    if (!userId && !telegramId) {
      return new Response(JSON.stringify({ error: 'userId or tg_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find user by userId or telegramId
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, telegram_id, telegram_username');

    if (userId) {
      query = query.eq('id', userId);
    } else if (telegramId) {
      query = query.eq('telegram_id', telegramId);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .single();

    if (roleError) {
      console.error('Error fetching role:', roleError);
      // Default role if not found
      return new Response(JSON.stringify({
        userId: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: 'user',
        telegramLinked: !!profile.telegram_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      user_id: profile.id,
      role: roleData.role,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in user-role:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
