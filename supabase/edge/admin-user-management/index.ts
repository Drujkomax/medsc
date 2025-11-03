import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Restrict CORS to Supabase project only
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': SUPABASE_URL.replace(/\/$/, ''), // Remove trailing slash
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create regular client to verify user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Не указан токен авторизации')
    }

    // Verify user is authenticated and get their role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Ошибка авторизации')
    }

    // Check if user is director using admin client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'director') {
      throw new Error('Недостаточно прав доступа')
    }

    const { action, userId, email, password, role } = await req.json()

    // Log admin action for audit trail
    await supabaseAdmin.rpc('log_system_event', {
      p_level: 'warn',
      p_category: 'security',
      p_message: `Admin action: ${action} on user ${userId}`,
      p_details: { 
        adminId: user.id, 
        adminEmail: user.email,
        action,
        targetUserId: userId,
        emailChange: email ? true : false,
        passwordChange: password ? true : false,
        roleChange: role || null
      },
      p_user_id: user.id
    });

    switch (action) {
      case 'updateUser':
        const updates: any = {}
        
        if (email) {
          updates.email = email
        }
        
        if (password) {
          updates.password = password
        }

        // Update user email/password if provided
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updates
          )
          
          if (updateError) {
            throw updateError
          }
        }

        // Update role if provided
        if (role) {
          const { error: roleUpdateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role })
            .eq('user_id', userId)

          if (roleUpdateError) {
            throw roleUpdateError
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Пользователь обновлен' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Неизвестное действие')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})