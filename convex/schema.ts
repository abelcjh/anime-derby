import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({ email: v.string(), source: v.optional(v.string()), createdAt: v.number() }).index('by_email', ['email']),
  videoJobs: defineTable({ email: v.string(), side: v.string(), persona: v.string(), prediction: v.string(), prompt: v.string(), script: v.string(), videoUrl: v.optional(v.string()), voiceUrl: v.optional(v.string()), status: v.string(), error: v.optional(v.string()), createdAt: v.number() }).index('by_email', ['email']).index('by_status', ['status']),
  events: defineTable({ email: v.optional(v.string()), type: v.string(), metadata: v.optional(v.any()), createdAt: v.number() }).index('by_type', ['type']),
  payments: defineTable({ email: v.string(), amount: v.number(), status: v.string(), dodoPaymentId: v.optional(v.string()), createdAt: v.number() }).index('by_status', ['status']),
  socialProof: defineTable({ platform: v.string(), url: v.string(), views: v.number(), likes: v.number(), comments: v.number(), createdAt: v.number() }).index('by_platform', ['platform']),
})
