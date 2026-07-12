import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createJob = mutation({
  args: { email: v.string(), side: v.string(), persona: v.string(), prediction: v.string(), prompt: v.string(), script: v.string() },
  handler: async (ctx, args) => {
    const createdAt = Date.now()
    const existing = await ctx.db.query('users').withIndex('by_email', q => q.eq('email', args.email)).first()
    if (!existing) await ctx.db.insert('users', { email: args.email, source: 'anime-derby', createdAt })
    return await ctx.db.insert('videoJobs', { ...args, status: 'generating', createdAt })
  },
})

export const completeJob = mutation({
  args: {
    jobId: v.id('videoJobs'),
    status: v.string(),
    videoUrl: v.optional(v.string()),
    voiceUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...patch } = args
    await ctx.db.patch(jobId, patch)
  },
})

export const trackEvent = mutation({
  args: { email: v.optional(v.string()), type: v.string(), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert('events', { ...args, createdAt: Date.now() })
  },
})

export const recordDodoPayment = mutation({
  args: { email: v.string(), amount: v.number(), status: v.string(), dodoPaymentId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert('payments', { ...args, createdAt: Date.now() })
  },
})

export const proof = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const jobs = await ctx.db.query('videoJobs').collect()
    const payments = await ctx.db.query('payments').collect()
    const events = await ctx.db.query('events').collect()
    return {
      signups: new Set(users.map(u => u.email)).size,
      activatedUsers: new Set(jobs.filter(j => ['completed', 'fallback'].includes(j.status)).map(j => j.email)).size,
      videosGenerated: jobs.length,
      successful: jobs.filter(j => j.status === 'completed').length,
      fallback: jobs.filter(j => j.status === 'fallback').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      franceFans: jobs.filter(j => j.side === 'France').length,
      spainFans: jobs.filter(j => j.side === 'Spain').length,
      shareClicks: events.filter(e => e.type === 'share_click').length,
      dodoCheckoutClicks: events.filter(e => e.type === 'dodo_checkout_click').length,
      paymentsCount: payments.length,
      paymentsAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      latestUsers: users.slice(-10).reverse(),
      latestJobs: jobs.slice(-15).reverse(),
    }
  },
})
