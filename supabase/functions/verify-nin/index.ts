import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nin, phone } = await req.json()

    if (!nin || !phone) {
      return new Response(
        JSON.stringify({ error: 'NIN and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Check if NIN is already used by another account
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('nin', nin)
      .single()

    if (existing && existing.phone !== phone) {
      return new Response(
        JSON.stringify({ error: 'This NIN is already linked to another account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark NIN as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nin_verified: true })
      .eq('phone', phone)

    if (updateError) throw new Error(updateError.message)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
