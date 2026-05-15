// supabase/functions/create-staff/index.ts
// Deploy with: supabase functions deploy create-staff
//
// This Edge Function runs with the SERVICE ROLE key and can create
// auth users — something the anon key cannot do from the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is an authenticated admin
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

    // Parse request body
    const { fullname, username, email, password } = await req.json()
    if (!fullname || !username || !email || !password) {
      throw new Error('Missing required fields: fullname, username, email, password')
    }

    // Create the user using the service role client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) throw createError

    // Insert profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUser.user!.id,
      fullname,
      username,
      role: 'staff',
      must_change_password: true,
    })

    if (profileError) {
      // Clean up the auth user if profile creation failed
      await adminClient.auth.admin.deleteUser(newUser.user!.id)
      throw profileError
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user!.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
