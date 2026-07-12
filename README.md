# Anime Derby: France vs Spain

Hackathon sprint product for the GrowthX World's Largest Hermes Buildathon.

Users enter an email, pick France or Spain, choose a funny football-fan persona and prediction, then generate a short anime-inspired football prophecy video/caption to share with a rival fan.

## Sponsor proof

- Cloudflare: Pages deploy target plus `/api/generate` Pages Function calling Workers AI Seedance 2.0 (`bytedance/seedance-2.0`) when credentials are configured.
- Convex: schema/actions for users, videoJobs, events, payments, socialProof.
- LinkUp: live-context call in the generation function.
- Dodo Payments: premium battle-pack checkout CTA.
- ElevenLabs: commentator voice-note hook in the generation function.
- Wispr Flow: proof-dashboard checklist slot for dictated-build screenshot.

## Local dev

```bash
npm install
npm run dev
```

Open `/proof` for the admin/proof dashboard.

## Environment

Do not commit secrets. Configure these in Cloudflare Pages project variables:

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
LINKUP_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
VITE_DODO_CHECKOUT_URL=
VITE_PUBLIC_URL=
```

## Deploy

```bash
npm run build
wrangler pages deploy dist --project-name anime-derby
```

This repository intentionally does not run the Seedance test command during setup.
