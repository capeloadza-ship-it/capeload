import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_D775EVxn_3XcvMdpMuxUmmc3mwmDXozfH'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'CapeLoad <noreply@capeload.co.za>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emails, subject, message } = await req.json()

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not set in Edge Function secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const htmlBody = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
        <img src="https://capeload.co.za/images/logo%20dark.png" style="height:56px;margin-bottom:28px;" alt="CapeLoad">
        <div style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:16px;">${subject}</div>
        <div style="font-size:15px;color:#444;line-height:1.8;white-space:pre-wrap;">${message}</div>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
        <div style="font-size:12px;color:#999;">
          CapeLoad Logistics &middot; Cape Town, South Africa<br>
          You're receiving this because you're registered on our platform.
        </div>
      </div>
    `

    // Send in batches of 10 to avoid rate limits
    const batchSize = 10
    let sent = 0

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      await Promise.all(
        batch.map((email: string) =>
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: email,
              subject: subject,
              html: htmlBody,
            }),
          })
        )
      )
      sent += batch.length
    }

    return new Response(
      JSON.stringify({ sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
