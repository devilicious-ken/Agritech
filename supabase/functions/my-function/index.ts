// supabase/functions/my-function/index.ts
import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  // Supabase Edge Functions automatically provide these env vars
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req) => {
  const { name } = await req.json()
  const { data, error } = await supabase.from('countries').select('id, name')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
