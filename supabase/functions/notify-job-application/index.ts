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
    const { job_id, applicant_id, cover_letter, cv_url } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch job + contact email stored by the poster
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, company, employer_id, contact_email')
      .eq('id', job_id)
      .single()
    if (jobError) throw new Error(jobError.message)
    if (!job.contact_email) throw new Error('No contact email on this job listing')

    // Fetch applicant profile
    const { data: applicantProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', applicant_id)
      .single()

    const applicantName = applicantProfile?.full_name || 'Applicant'
    const applicantPhone = applicantProfile?.phone || 'Not provided'
    const jobTitle = job.title
    const company = job.company ? ` at ${job.company}` : ''

    const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f9f9f9; padding: 24px;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; padding:32px; border:1px solid #e5e7eb;">
    <h2 style="color:#b8860b; margin-bottom:4px;">New Job Application</h2>
    <p style="color:#6b7280; margin-top:0;">Someone applied for <strong>${jobTitle}${company}</strong> on Tradenet.</p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;">

    <h3 style="margin-bottom:8px; color:#111827;">Applicant Details</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:6px 0; color:#6b7280; width:130px;">Name</td><td style="color:#111827; font-weight:600;">${applicantName}</td></tr>
      <tr><td style="padding:6px 0; color:#6b7280;">Phone</td><td style="color:#111827;">${applicantPhone}</td></tr>
    </table>

    ${cover_letter ? `
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;">
    <h3 style="margin-bottom:8px; color:#111827;">Cover Letter</h3>
    <p style="color:#374151; line-height:1.6; white-space:pre-wrap;">${cover_letter}</p>
    ` : ''}

    ${cv_url ? `
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;">
    <h3 style="margin-bottom:12px; color:#111827;">CV / Resume</h3>
    <a href="${cv_url}" style="display:inline-block; background:#b8860b; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:700;">Download CV</a>
    ` : ''}

    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;">
    <p style="color:#9ca3af; font-size:12px; text-align:center;">Sent via Tradenet · Nigerian Marketplace</p>
  </div>
</body>
</html>`

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Tradenet <onboarding@resend.dev>',
        to: job.contact_email,
        subject: `New application for "${jobTitle}" — ${applicantName}`,
        html: emailBody,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      throw new Error(`Email send failed: ${errBody}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-job-application error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
