import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'info@capeload.co.za'
const FROM_NAME  = 'CapeLoad Logistics'

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

    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'BREVO_API_KEY not set in Edge Function secrets' }),
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
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <!-- Header -->
        <div style="background:#0a0b15;padding:24px 32px;border-radius:12px 12px 0 0;">
          <img src="https://capeload.co.za/images/logo-light.png" style="height:52px;" alt="CapeLoad Logistics">
        </div>
        <!-- Body -->
        <div style="padding:36px 32px;">
          <div style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:16px;">${subject}</div>
          <div style="font-size:15px;color:#444;line-height:1.8;white-space:pre-wrap;">${message}</div>
          <div style="margin-top:32px;">
            <a href="https://capeload.co.za/booking.html" style="display:inline-block;background:#f15f22;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">Book a Load</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="background:#f7f5f2;border-top:1px solid #e8e5e0;padding:24px 32px;border-radius:0 0 12px 12px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
            <img src="https://capeload.co.za/images/logo%20dark.png" style="height:28px;" alt="CapeLoad">
          </div>
          <div style="font-size:12px;color:#888;line-height:1.7;">
            <strong style="color:#555;">CapeLoad Logistics</strong> &middot; Cape Town, South Africa<br>
            <a href="https://capeload.co.za" style="color:#f15f22;text-decoration:none;">capeload.co.za</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:info@capeload.co.za" style="color:#f15f22;text-decoration:none;">info@capeload.co.za</a><br><br>
            You're receiving this because you're registered on CapeLoad. If you believe this was sent in error, please contact us.
          </div>
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
          fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': BREVO_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: FROM_NAME, email: FROM_EMAIL },
              to: [{ email }],
              subject: subject,
              htmlContent: htmlBody,
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
