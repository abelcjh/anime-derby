import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createJob = mutation({
  args: { email: v.string(), side: v.string(), persona: v.string(), prediction: v.string(), prompt: v.string(), script: v.string() },
  handler: async (ctx, args) => {
    const createdAt = Date.now()
    await ctx.db.insert('users', { email: args.email, source: 'anime-derby', createdAt })
    return await ctx.db.insert('videoJobs', { ...args, status: 'generating', createdAt })
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
      activatedUsers: new Set(jobs.filter(j => j.status === 'completed').map(j => j.email)).size,
      videosGenerated: jobs.length,
      franceFans: jobs.filter(j => j.side === 'France').length,
      spainFans: jobs.filter(j => j.side === 'Spain').length,
      shareClicks: events.filter(e => e.type === 'share_click').length,
      paymentsCount: payments.length,
      paymentsAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      latestUsers: users.slice(-10).reverse(),
      latestJobs: jobs.slice(-10).reverse(),
    }
  },
})
