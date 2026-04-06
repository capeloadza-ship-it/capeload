import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const FROM_EMAIL    = Deno.env.get('FROM_EMAIL') || 'info@capeload.co.za'
const FROM_NAME     = 'CapeLoad Logistics'
const ADMIN_EMAIL   = 'info@capeload.co.za'
const SITE_URL      = 'https://capeload.co.za'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function wrap(content: string): string {
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0a0b15;padding:22px 32px;border-radius:12px 12px 0 0;">
    <img src="${SITE_URL}/images/logo-light.png" style="height:50px;" alt="CapeLoad Logistics">
  </div>
  <div style="padding:36px 32px;">
    ${content}
  </div>
  <div style="background:#f7f5f2;border-top:1px solid #e8e5e0;padding:22px 32px;border-radius:0 0 12px 12px;">
    <div style="font-size:12px;color:#888;line-height:1.7;">
      <strong style="color:#555;">CapeLoad Logistics</strong> &middot; Cape Town, South Africa<br>
      <a href="${SITE_URL}" style="color:#f15f22;text-decoration:none;">capeload.co.za</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:${ADMIN_EMAIL}" style="color:#f15f22;text-decoration:none;">${ADMIN_EMAIL}</a>
    </div>
  </div>
</div>`
}

function btn(text: string, url: string): string {
  return `<div style="margin-top:28px;"><a href="${url}" style="display:inline-block;background:#f15f22;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">${text}</a></div>`
}

function h1(text: string): string {
  return `<div style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:14px;">${text}</div>`
}

function p(text: string): string {
  return `<p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 10px;">${text}</p>`
}

function detail(label: string, value: string): string {
  return `<div style="display:flex;gap:16px;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
    <span style="color:#888;min-width:130px;">${label}</span>
    <span style="color:#1a1a1a;font-weight:600;">${value}</span>
  </div>`
}

type TemplateData = Record<string, string>

function buildEmail(template: string, data: TemplateData): { subject: string; html: string } | null {
  switch (template) {

    case 'newsletter_welcome':
      return {
        subject: 'Welcome to CapeLoad Updates',
        html: wrap(
          h1('You\'re in!') +
          p('Thanks for subscribing to CapeLoad updates. You\'ll be the first to hear about special offers, new services, and logistics news across the Western Cape.') +
          p('In the meantime, book a load or register your vehicle on our platform.') +
          btn('Book a Load', `${SITE_URL}/booking.html`)
        )
      }

    case 'booking_confirmation':
      return {
        subject: `Booking Confirmed — ${data.ref}`,
        html: wrap(
          h1(`Booking Confirmed`) +
          p(`Hi ${data.name}, your booking has been received and is being processed. Keep your reference number safe.`) +
          `<div style="background:#f9f7f5;border-radius:10px;padding:20px;margin:20px 0;">` +
          detail('Reference', data.ref) +
          detail('Vehicle', data.vehicle) +
          detail('Pickup', data.pickup) +
          detail('Drop-off', data.dropoff) +
          (data.date ? detail('Date', data.date) : '') +
          (data.time ? detail('Time', data.time) : '') +
          detail('Total', `R${data.total}`) +
          detail('Payment', data.payment) +
          `</div>` +
          p('We\'ll notify you once a driver has been assigned. You can also track your booking via WhatsApp.') +
          btn('Track on WhatsApp', `https://wa.me/27625692939?text=Hi%20CapeLoad%21%20My%20booking%20ref%20is%20${data.ref}`)
        )
      }

    case 'booking_admin':
      return {
        subject: `New Booking — ${data.ref}`,
        html: wrap(
          h1(`New Booking Received`) +
          `<div style="background:#f9f7f5;border-radius:10px;padding:20px;margin:20px 0;">` +
          detail('Reference', data.ref) +
          detail('Client', data.name) +
          detail('Phone', data.phone) +
          (data.clientEmail ? detail('Email', data.clientEmail) : '') +
          detail('Vehicle', data.vehicle) +
          detail('Pickup', data.pickup) +
          detail('Drop-off', data.dropoff) +
          (data.date ? detail('Date', data.date) : '') +
          detail('Total', `R${data.total}`) +
          detail('Payment', data.payment) +
          `</div>` +
          btn('Open Admin Panel', `${SITE_URL}/admin.html`)
        )
      }

    case 'driver_application_received':
      return {
        subject: 'Driver Application Received — CapeLoad',
        html: wrap(
          h1('Application Received!') +
          p(`Hi ${data.name}, thank you for registering as a driver on CapeLoad.`) +
          p('Your application is currently under review. Our team will assess your documents and vehicle details within 24–48 hours.') +
          p('We\'ll send you an email as soon as a decision has been made.') +
          `<div style="background:#f9f7f5;border-radius:10px;padding:20px;margin:20px 0;">` +
          detail('Name', data.name) +
          detail('Vehicle', `${data.vehicleType} — ${data.make} ${data.model}`) +
          detail('Plate', data.plate) +
          `</div>` +
          p('Questions? Reach us on WhatsApp anytime.') +
          btn('WhatsApp Support', 'https://wa.me/27625692939')
        )
      }

    case 'driver_admin_notification':
      return {
        subject: `New Driver Application — ${data.name}`,
        html: wrap(
          h1('New Driver Application') +
          `<div style="background:#f9f7f5;border-radius:10px;padding:20px;margin:20px 0;">` +
          detail('Name', data.name) +
          detail('Email', data.email) +
          detail('Phone', data.phone) +
          detail('Vehicle', `${data.vehicleType} — ${data.make} ${data.model} (${data.plate})`) +
          detail('Area', data.area) +
          `</div>` +
          btn('Review in Admin', `${SITE_URL}/admin.html`)
        )
      }

    case 'driver_approved':
      return {
        subject: 'Application Approved — Welcome to CapeLoad!',
        html: wrap(
          h1('You\'re approved! 🎉') +
          p(`Hi ${data.name}, great news! Your CapeLoad driver application has been approved.`) +
          p('You can now log in to your driver portal to set your availability, view job requests, and track your earnings.') +
          btn('Open Driver Portal', `${SITE_URL}/auth.html?redirect=driver-portal.html`)
        )
      }

    case 'driver_rejected':
      return {
        subject: 'Application Update — CapeLoad',
        html: wrap(
          h1('Application Update') +
          p(`Hi ${data.name}, thank you for applying to drive with CapeLoad.`) +
          p('Unfortunately, we were unable to approve your application at this time. This may be due to incomplete documentation or vehicle requirements not being met.') +
          p('Please contact our support team if you have any questions or would like to reapply.') +
          btn('Contact Support', 'https://wa.me/27625692939')
        )
      }

    case 'driver_suspended':
      return {
        subject: 'Account Suspended — CapeLoad',
        html: wrap(
          h1('Account Suspended') +
          p(`Hi ${data.name}, your CapeLoad driver account has been temporarily suspended.`) +
          p('Please contact our support team to understand the reason and discuss next steps.') +
          btn('Contact Support', 'https://wa.me/27625692939')
        )
      }

    case 'booking_assigned_driver':
      return {
        subject: `New Job Assigned — ${data.ref}`,
        html: wrap(
          h1('You have a new job! 🚛') +
          p(`Hi ${data.driverName}, a booking has been assigned to you. Please log in to your driver portal to accept and view the full details.`) +
          `<div style="background:#f9f7f5;border-radius:10px;padding:20px;margin:20px 0;">` +
          detail('Reference', data.ref) +
          detail('Vehicle', data.vehicle) +
          detail('Pickup', data.pickup) +
          detail('Drop-off', data.dropoff) +
          (data.date ? detail('Date', data.date) : '') +
          (data.time ? detail('Time', data.time) : '') +
          detail('Your Payout', `R${data.total}`) +
          `</div>` +
          p('Accept the job in your portal as soon as possible to confirm your availability.') +
          btn('Open Driver Portal', `${SITE_URL}/auth.html?redirect=driver-portal.html`)
        )
      }

    default:
      return null
  }
}

async function sendViaBrevo(to: string, subject: string, html: string) {
  if (!BREVO_API_KEY) return { error: 'BREVO_API_KEY not set' }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    return { error: text }
  }
  return { ok: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { to, template, data, also_notify_admin } = await req.json()
    if (!to || !template) {
      return new Response(JSON.stringify({ error: 'Missing to or template' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const built = buildEmail(template, data || {})
    if (!built) {
      return new Response(JSON.stringify({ error: 'Unknown template: ' + template }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const result = await sendViaBrevo(to, built.subject, built.html)

    // Optionally also send to admin (e.g. for new bookings / new driver signups)
    if (also_notify_admin) {
      const adminBuilt = buildEmail(also_notify_admin.template, also_notify_admin.data || data || {})
      if (adminBuilt) await sendViaBrevo(ADMIN_EMAIL, adminBuilt.subject, adminBuilt.html)
    }

    return new Response(JSON.stringify(result), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
