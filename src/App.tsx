import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from 'convex/react'
import type { Id } from '../convex/_generated/dataModel'
import { api } from '../convex/_generated/api'
import './App.css'

type Side = 'France' | 'Spain'
type Persona = 'delusional fan' | 'VAR villain' | 'anime striker' | 'cursed goalkeeper' | 'toxic pundit'
type Prediction = 'France wins' | 'Spain wins' | 'penalties chaos' | 'VAR meltdown' | 'last-minute screamer'
type JobStatus = 'draft' | 'generating' | 'completed' | 'fallback' | 'failed'

type Job = {
  id: string
  convexId?: Id<'videoJobs'>
  email: string
  side: Side
  persona: Persona
  prediction: Prediction
  prompt: string
  script: string
  caption: string
  status: JobStatus
  videoUrl?: string
  voiceUrl?: string
  error?: string
  createdAt: number
}

type Proof = {
  shareClicks: number
  paymentsAmount: number
  paymentsCount: number
  socialPosts: { platform: string; url: string; views: number; likes: number; comments: number }[]
}

type ConvexProof = {
  signups: number
  activatedUsers: number
  videosGenerated: number
  successful: number
  fallback: number
  failed: number
  franceFans: number
  spainFans: number
  shareClicks: number
  dodoCheckoutClicks: number
  paymentsCount: number
  paymentsAmount: number
  latestUsers: { email: string; side?: string; createdAt: number }[]
  latestJobs: { _id: Id<'videoJobs'>; email: string; side: string; persona: string; status: string; createdAt: number }[]
}

const personas: Persona[] = ['delusional fan', 'VAR villain', 'anime striker', 'cursed goalkeeper', 'toxic pundit']
const predictions: Prediction[] = ['France wins', 'Spain wins', 'penalties chaos', 'VAR meltdown', 'last-minute screamer']
const dodoCheckout = import.meta.env.VITE_DODO_CHECKOUT_URL || 'https://test.checkout.dodopayments.com/buy/pdt_0Nj0OfvJ6sbm2LfZ4ePvA?quantity=1'
const liveUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://adamant-sparrow-609.convex.cloud'
const convexClient = new ConvexReactClient(convexUrl)

function loadJobs(): Job[] {
  try { return JSON.parse(localStorage.getItem('anime-derby-jobs') || '[]') } catch { return [] }
}
function saveJobs(jobs: Job[]) { localStorage.setItem('anime-derby-jobs', JSON.stringify(jobs)) }
function loadProof(): Proof {
  try { return JSON.parse(localStorage.getItem('anime-derby-proof') || '') } catch {
    return { shareClicks: 0, paymentsAmount: 0, paymentsCount: 0, socialPosts: [] }
  }
}
function saveProof(proof: Proof) { localStorage.setItem('anime-derby-proof', JSON.stringify(proof)) }

function buildScript(side: Side, persona: Persona, prediction: Prediction) {
  const rival = side === 'France' ? 'Spain' : 'France'
  return `BREAKING FROM THE ANIME DERBY STADIUM: ${side} fans have entered prophecy mode. A ${persona} announces that ${prediction}, while ${rival} supporters claim the referee has been written by a comedy villain. The ball glows, the crowd freezes, and one rival fan is legally required to generate a counter-video.`
}
function buildPrompt(side: Side, persona: Persona, prediction: Prediction) {
  const sideColor = side === 'France' ? 'blue-white-red aura' : 'red-gold aura'
  return `A 10-second vertical anime-inspired football prophecy video for a France vs Spain football semi-final. No real player likenesses, no official logos, no copyrighted anime style names. Use generic football archetypes and team color energy. Scene: ${side} fan hero/striker under glowing stadium lights, ${sideColor}, dramatic speed lines, football aura, comedic sports shonen energy. Persona: ${persona}. Prediction: ${prediction}. Mood: funny, cinematic, social media reel, high-energy, memeable. End with a dramatic freeze-frame feeling.`
}
function buildCaption(side: Side, persona: Persona, prediction: Prediction) {
  return `I just generated my France vs Spain anime prophecy.\n\nTeam: ${side}\nPersona: ${persona}\nPrediction: ${prediction}\n\nmake your counter-video here:\n${liveUrl}`
}
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ])
}
function fallbackVideo(side: Side, persona: Persona, prediction: Prediction) {
  const colors = side === 'France' ? ['#173bff', '#ffffff', '#f42b5b'] : ['#ff2a2a', '#ffd447', '#8b1111']
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${colors[0]}'/><stop offset='.55' stop-color='${colors[1]}'/><stop offset='1' stop-color='${colors[2]}'/></linearGradient><filter id='glow'><feGaussianBlur stdDeviation='8' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><rect width='720' height='1280' fill='url(#g)'/><g fill='none' stroke='rgba(255,255,255,.45)' stroke-width='8'>${Array.from({length:18},(_,i)=>`<path d='M${40*i%720} 0 L${720-(i*73%720)} 1280'/>`).join('')}</g><circle cx='360' cy='540' r='150' fill='rgba(0,0,0,.28)' stroke='white' stroke-width='10' filter='url(#glow)'/><text x='360' y='250' text-anchor='middle' font-family='Arial Black,Arial' font-size='58' fill='white'>ANIME DERBY</text><text x='360' y='340' text-anchor='middle' font-family='Arial Black,Arial' font-size='64' fill='white'>${side}</text><text x='360' y='555' text-anchor='middle' font-family='Arial Black,Arial' font-size='88' fill='white'>⚽</text><text x='360' y='790' text-anchor='middle' font-family='Arial Black,Arial' font-size='42' fill='white'>${persona.toUpperCase()}</text><foreignObject x='70' y='850' width='580' height='240'><div xmlns='http://www.w3.org/1999/xhtml' style='font-family:Arial Black,Arial;color:white;text-align:center;font-size:46px;line-height:1.15;text-shadow:0 4px 18px black'>${prediction}</div></foreignObject><text x='360' y='1160' text-anchor='middle' font-family='Arial' font-size='28' fill='white'>send this to a rival fan →</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export default function App() {
  return <ConvexProvider client={convexClient}><AppInner /></ConvexProvider>
}

function AppInner() {
  const [email, setEmail] = useState('')
  const [side, setSide] = useState<Side>('France')
  const [persona, setPersona] = useState<Persona>('delusional fan')
  const [prediction, setPrediction] = useState<Prediction>('last-minute screamer')
  const [jobs, setJobs] = useState<Job[]>(loadJobs)
  const [proof, setProof] = useState<Proof>(loadProof)
  const [adminMode, setAdminMode] = useState(location.pathname.includes('proof') || location.pathname.includes('admin'))

  const convexProof = useQuery(api.jobs.proof) as ConvexProof | undefined
  const createJob = useMutation(api.jobs.createJob)
  const completeJob = useMutation(api.jobs.completeJob)
  const trackEvent = useMutation(api.jobs.trackEvent)

  const stats = useMemo(() => {
    if (convexProof) return {
      signups: convexProof.signups,
      activated: convexProof.activatedUsers,
      videos: convexProof.videosGenerated,
      successful: convexProof.successful,
      fallback: convexProof.fallback,
      failed: convexProof.failed,
      france: convexProof.franceFans,
      spain: convexProof.spainFans,
      shareClicks: convexProof.shareClicks,
      dodoClicks: convexProof.dodoCheckoutClicks,
      paymentsCount: convexProof.paymentsCount,
      paymentsAmount: convexProof.paymentsAmount,
    }
    const emails = new Set(jobs.map(j => j.email))
    const activated = new Set(jobs.filter(j => ['completed', 'fallback'].includes(j.status)).map(j => j.email))
    return {
      signups: emails.size,
      activated: activated.size,
      videos: jobs.length,
      successful: jobs.filter(j => j.status === 'completed').length,
      fallback: jobs.filter(j => j.status === 'fallback').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      france: jobs.filter(j => j.side === 'France').length,
      spain: jobs.filter(j => j.side === 'Spain').length,
      shareClicks: proof.shareClicks,
      dodoClicks: 0,
      paymentsCount: proof.paymentsCount,
      paymentsAmount: proof.paymentsAmount,
    }
  }, [convexProof, jobs, proof])

  async function generate(e: FormEvent) {
    e.preventDefault()
    const prompt = buildPrompt(side, persona, prediction)
    const script = buildScript(side, persona, prediction)
    const caption = buildCaption(side, persona, prediction)
    const id = crypto.randomUUID()
    let convexId: Id<'videoJobs'> | undefined
    const base: Job = { id, email, side, persona, prediction, prompt, script, caption, status: 'generating', createdAt: Date.now() }
    const next = [base, ...jobs]
    setJobs(next); saveJobs(next)
    try {
      convexId = await withTimeout(createJob({ email, side, persona, prediction, prompt, script }), 2500, 'Convex createJob').catch(() => undefined)
      if (convexId) {
        base.convexId = convexId
        const withConvexId = [{ ...base }, ...jobs]
        setJobs(withConvexId); saveJobs(withConvexId)
      }
      const res = await withTimeout(fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, side, persona, prediction, prompt, script }) }), 45000, 'Generate API')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      const status: JobStatus = data.videoUrl ? 'completed' : 'fallback'
      const done: Job = { ...base, convexId, status, videoUrl: data.videoUrl || fallbackVideo(side, persona, prediction), voiceUrl: data.voiceUrl, caption, script: data.script || script }
      if (convexId) await completeJob({ jobId: convexId, status, videoUrl: data.videoUrl, voiceUrl: data.voiceUrl }).catch(() => undefined)
      const updated = [done, ...jobs]
      setJobs(updated); saveJobs(updated)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'fallback'
      const done: Job = { ...base, convexId, status: 'fallback', videoUrl: fallbackVideo(side, persona, prediction), error, caption }
      if (convexId) await completeJob({ jobId: convexId, status: 'fallback', error }).catch(() => undefined)
      const updated = [done, ...jobs]
      setJobs(updated); saveJobs(updated)
    }
  }

  async function trackShare(job: Job) {
    const next = { ...proof, shareClicks: proof.shareClicks + 1 }
    setProof(next); saveProof(next)
    navigator.clipboard?.writeText(job.caption)
    await trackEvent({ email: job.email, type: 'share_click', metadata: { side: job.side, persona: job.persona } }).catch(() => undefined)
  }

  async function openDodo(job?: Job) {
    window.open(dodoCheckout, '_blank', 'noopener,noreferrer')
    await trackEvent({ email: job?.email || email || undefined, type: 'dodo_checkout_click', metadata: { product: 'Anime Derby Premium Battle Pack', url: dodoCheckout } }).catch(() => undefined)
  }

  if (adminMode) {
    const latestConvexJobs = convexProof?.latestJobs || []
    const latestLocalJobs = jobs.slice(0, 15)
    return <main className="app admin">
      <button className="ghost" onClick={() => setAdminMode(false)}>← back to product</button>
      <h1>Anime Derby Proof Dashboard</h1>
      <p className="sub">Live proof for Cloudflare + Convex + LinkUp + Dodo + ElevenLabs + Wispr.</p>
      <section className="grid stats">
        <Metric label="Signups" value={stats.signups} /><Metric label="Activated users" value={stats.activated} /><Metric label="Videos generated" value={stats.videos} /><Metric label="Successful video jobs" value={stats.successful} />
        <Metric label="Fallback/static outputs" value={stats.fallback} /><Metric label="Failed jobs" value={stats.failed} /><Metric label="France fans" value={stats.france} /><Metric label="Spain fans" value={stats.spain} />
        <Metric label="Share clicks" value={stats.shareClicks} /><Metric label="Dodo checkout clicks" value={stats.dodoClicks} /><Metric label="Dodo payments" value={`${stats.paymentsCount} / $${stats.paymentsAmount}`} />
      </section>
      <section className="panel"><h2>Sponsor checklist</h2><div className="checklist">
        {['Cloudflare Pages + Workers AI Seedance route','Convex live database for users, jobs, events, proof metrics','LinkUp live-context hook in generation route','Dodo real test-mode product checkout link + click tracking','ElevenLabs commentator voice note hook','Wispr Flow proof screenshot placeholder'].map(x => <span key={x}>✅ {x}</span>)}
      </div></section>
      <section className="panel"><h2>Dashboard links</h2><div className="buttons"><a href="https://dash.cloudflare.com/" target="_blank">Cloudflare dashboard</a><a href="https://dashboard.convex.dev/t/abel-chin/anime-derby" target="_blank">Convex dashboard</a><a href="https://app.dodopayments.com/products" target="_blank">Dodo product</a><button onClick={() => openDodo()}>Open Dodo checkout</button></div></section>
      <section className="panel"><h2>Manual social metrics fallback</h2><ManualProof proof={proof} setProof={(p) => { setProof(p); saveProof(p) }} /></section>
      <section className="panel"><h2>Latest users</h2><table><tbody>{(convexProof?.latestUsers || Array.from(new Set(jobs.map(j=>j.email))).map(mail => ({ email: mail, side: jobs.find(j=>j.email===mail)?.side, createdAt: jobs.find(j=>j.email===mail)?.createdAt || Date.now() }))).slice(0,12).map(user => <tr key={user.email}><td>{user.email}</td><td>{user.side}</td><td>{new Date(user.createdAt).toLocaleString()}</td></tr>)}</tbody></table></section>
      <section className="panel"><h2>Latest video jobs</h2><table><thead><tr><th>Email</th><th>Side</th><th>Persona</th><th>Status</th><th>Created</th></tr></thead><tbody>{(latestConvexJobs.length ? latestConvexJobs : latestLocalJobs).map(j => <tr key={'_id' in j ? j._id : j.id}><td>{j.email}</td><td>{j.side}</td><td>{j.persona}</td><td>{j.status}</td><td>{new Date(j.createdAt).toLocaleTimeString()}</td></tr>)}</tbody></table></section>
    </main>
  }

  const latest = jobs[0]
  return <main className="app">
    <nav><strong>Anime Derby</strong><button className="ghost" onClick={() => setAdminMode(true)}>proof dashboard</button></nav>
    <section className="hero"><div><p className="eyebrow">France vs Spain is now an anime</p><h1>Generate your football prophecy video.</h1><p className="sub">Pick a side. Get roasted in anime form. Send it to a rival fan and make them counter.</p></div><div className="scorecard"><span>🇫🇷 France</span><b>VS</b><span>🇪🇸 Spain</span></div></section>
    <form className="panel form" onSubmit={generate}>
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label>Side<select value={side} onChange={e => setSide(e.target.value as Side)}><option>France</option><option>Spain</option></select></label>
      <label>Persona<select value={persona} onChange={e => setPersona(e.target.value as Persona)}>{personas.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Prediction<select value={prediction} onChange={e => setPrediction(e.target.value as Prediction)}>{predictions.map(x => <option key={x}>{x}</option>)}</select></label>
      <button type="submit">Generate prophecy</button>
      {latest?.status === 'generating' && <p className="sub">Generating now… if AI video is slow, a prophecy card fallback appears automatically.</p>}
    </form>
    {latest && <section className="result panel"><h2>Your prophecy</h2><p className="badge">{latest.status}</p><div className="output"><img src={latest.videoUrl || fallbackVideo(latest.side, latest.persona, latest.prediction)} alt="generated anime prophecy" /><div><h3>Commentator script</h3><p>{latest.script}</p><h3>Share caption</h3><pre>{latest.caption}</pre><div className="buttons"><button onClick={() => trackShare(latest)}>Copy caption + track share</button><button onClick={() => openDodo(latest)}>$0.50 premium battle pack</button></div>{latest.voiceUrl && <audio controls src={latest.voiceUrl} />}</div></div></section>}
    <section className="panel"><h2>Live proof hooks</h2><div className="checklist"><span>Cloudflare Seedance route</span><span>Convex live database</span><span>LinkUp context hook</span><span>Dodo checkout link</span><span>ElevenLabs voice hook</span><span>Wispr screenshot slot in /proof</span></div></section>
  </main>
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="metric"><small>{label}</small><b>{value}</b></div> }
function ManualProof({ proof, setProof }: { proof: Proof; setProof: (p: Proof) => void }) {
  return <div className="manual"><label>Share clicks<input type="number" value={proof.shareClicks} onChange={e => setProof({ ...proof, shareClicks: +e.target.value })} /></label><label>Dodo count<input type="number" value={proof.paymentsCount} onChange={e => setProof({ ...proof, paymentsCount: +e.target.value })} /></label><label>Dodo amount<input type="number" value={proof.paymentsAmount} onChange={e => setProof({ ...proof, paymentsAmount: +e.target.value })} /></label></div>
}
