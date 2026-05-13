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
    const { phone } = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { error: dbError } = await supabase
      .from('otp_codes')
      .upsert({ phone, code: otp, expires_at: expiresAt }, { onConflict: 'phone' })

    if (dbError) throw new Error(dbError.message)

    const token = Deno.env.get('KUDISMS_TOKEN')
    const sender = Deno.env.get('KUDISMS_SENDER_ID')
    const mobile = phone.replace('+', '')
    const message = `Your Tradenet verification code is: ${otp}. Valid for 10 minutes. Do not share.`

    const params = new URLSearchParams({ token, message, sender, mobiles: mobile })
    const smsRes = await fetch(`https://account.kudisms.net/api/?${params}`)
    const smsBody = await smsRes.text()
    console.log('KudiSMS response:', smsBody)

    const parsed = JSON.parse(smsBody)
    if (parsed.error) {
      throw new Error(`SMS failed: ${parsed.error}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-otp error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})