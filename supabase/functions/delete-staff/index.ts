import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') throw new Error('Forbidden: admin only')

    const { userId } = await req.json()
    if (!userId) throw new Error('Missing userId')

    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
    if (!serviceRoleKey) throw new Error('Missing SERVICE_ROLE_KEY secret')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey
    )

    // Attempt to delete the auth user first
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

    // Attempt to delete the profile record
    const { error: deleteProfileError } = await adminClient.from('profiles').delete().eq('id', userId)

    if (deleteAuthError || deleteProfileError) {
      const messages = [deleteAuthError?.message, deleteProfileError?.message].filter(Boolean).join(' | ')
      throw new Error(messages || 'Failed to delete user')
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
