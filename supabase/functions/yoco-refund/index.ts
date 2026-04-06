import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chargeId, amountInCents } = await req.json()

    if (!chargeId || !amountInCents || amountInCents < 1) {
      return new Response(JSON.stringify({ error: 'Missing chargeId or amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const secretKey = Deno.env.get('YOCO_SECRET_KEY')
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Payment service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch('https://online.yoco.com/v1/refunds/', {
      method: 'POST',
      headers: {
        'X-Auth-Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chargeId, amountInCents }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Yoco refund failed:', result)
      return new Response(JSON.stringify({ error: result.displayMessage || result.message || 'Refund failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id, status: result.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('yoco-refund error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
