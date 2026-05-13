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
    const { userId, photo } = await req.json()

    if (!userId || !photo) {
      return new Response(
        JSON.stringify({ error: 'userId and photo are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Decode base64 photo
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '')
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

    const filePath = `verification/${userId}/photo.jpg`

    const { error: uploadError } = await supabase.storage
      .from('verification-photos')
      .upload(filePath, binary, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage
      .from('verification-photos')
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
