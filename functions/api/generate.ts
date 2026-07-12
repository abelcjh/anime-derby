/// <reference types="@cloudflare/workers-types" />

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as GenerateRequest
  const script = body.script || `Anime Derby prophecy for ${body.side}: ${body.prediction}.`
  const context = await fetchLinkUpContext(env, body)
  const prompt = `${body.prompt}\nGrounding context: ${context}`

  const [videoUrl, voiceUrl] = await Promise.all([
    runSeedance(env, prompt).catch(() => undefined),
    runElevenLabs(env, script).catch(() => undefined),
  ])

  return Response.json({ ok: true, script, videoUrl, voiceUrl, contextUsed: Boolean(context) })
}

type Env = {
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
  LINKUP_API_KEY?: string
  ELEVENLABS_API_KEY?: string
  ELEVENLABS_VOICE_ID?: string
}
type GenerateRequest = { email: string; side: string; persona: string; prediction: string; prompt: string; script?: string }

async function fetchLinkUpContext(env: Env, body: GenerateRequest) {
  if (!env.LINKUP_API_KEY) return 'No LinkUp key configured; using safe generic France vs Spain rivalry context.'
  const res = await fetch('https://api.linkup.so/v1/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LINKUP_API_KEY}` },
    body: JSON.stringify({ q: `France vs Spain football semi-final latest storylines ${body.prediction}`, depth: 'standard', outputType: 'sourcedAnswer' }),
  })
  if (!res.ok) return 'LinkUp request failed; using generic football rivalry context.'
  return JSON.stringify(await res.json()).slice(0, 1200)
}

async function runSeedance(env: Env, prompt: string) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) return undefined
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'cf-aig-gateway-id': 'default',
    },
    body: JSON.stringify({ model: 'bytedance/seedance-2.0', input: { prompt, aspect_ratio: '9:16', duration: 10, resolution: '720p' } }),
  })
  if (!res.ok) return undefined
  const data: any = await res.json()
  return data?.result?.result?.video || data?.result?.video || data?.video || data?.result?.url
}

async function runElevenLabs(env: Env, script: string) {
  if (!env.ELEVENLABS_API_KEY) return undefined
  const voice = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: script, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.7 } }),
  })
  if (!res.ok) return undefined
  const audio = await res.arrayBuffer()
  const b64 = btoa(String.fromCharCode(...new Uint8Array(audio)))
  return `data:audio/mpeg;base64,${b64}`
}
