import { z } from "zod";

export const bloodTypes = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;
export const urgencyLevels = ["CRITICAL", "URGENT", "STANDARD"] as const;

const coarseLocationSchema = z.object({
  stateRegion: z.string().trim().min(2).max(80),
  township: z.string().trim().min(2).max(80),
  geohash: z.string().trim().min(4).max(12).optional(),
});

export const bootstrapUserSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  locale: z.enum(["my", "en"]).default("my"),
});

export const donorProfileSchema = z.object({
  bloodType: z.enum(bloodTypes),
  availability: z.enum(["AVAILABLE_NOW", "AVAILABLE_TODAY", "PAUSED"]),
  lastDonationDate: z.union([z.string().date(), z.literal("")]).nullable().transform((value) => value || null),
  coarseLocation: coarseLocationSchema,
});

export const requestSchema = z.object({
  bloodTypeNeeded: z.enum(bloodTypes),
  urgency: z.enum(urgencyLevels),
  coarseLocation: coarseLocationSchema,
  hospital: z.string().trim().min(2).max(160),
  neededBy: z.string().datetime(),
  expiresAt: z.string().datetime(),
  unitsRequired: z.number().int().min(1).max(10),
  additionalInstructions: z.string().trim().max(500).optional(),
  organizationId: z.string().trim().min(1).max(128).nullable().optional(),
  preciseDestination: z
    .object({
      address: z.string().trim().min(3).max(240),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
}).refine((value) => new Date(value.expiresAt) > new Date(), {
  message: "Expiration must be in the future.",
  path: ["expiresAt"],
});

export const matchResponseSchema = z.object({
  matchId: z.string().trim().min(8).max(128),
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export const createMatchesSchema = z.object({
  requestId: z.string().trim().min(8).max(128),
  expiresAt: z.string().datetime(),
  maximumCandidates: z.number().int().min(1).max(50).default(20),
}).refine((value) => new Date(value.expiresAt) > new Date(), {
  message: "Expiration must be in the future.",
  path: ["expiresAt"],
});

export const revealSchema = z.object({
  matchId: z.string().trim().min(8).max(128),
});

export const requestActionSchema = z.object({
  requestId: z.string().trim().min(8).max(128),
  action: z.enum(["CANCEL", "CLOSE"]),
});

export const messageSchema = z.object({
  conversationId: z.string().trim().min(8).max(128),
  content: z.string().trim().min(1).max(2000),
});

export const deviceTokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(["WEB"]),
});

export const reportSchema = z.object({
  targetType: z.enum(["USER", "REQUEST", "MATCH", "MESSAGE", "ORGANIZATION"]),
  targetId: z.string().trim().min(1).max(128),
  reason: z.enum(["SPAM", "HARASSMENT", "FAKE_REQUEST", "PRIVACY", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(["HOSPITAL", "BLOOD_BANK", "CLINIC", "CHARITY", "COMMUNITY"]),
  coarseLocation: coarseLocationSchema,
  description: z.string().trim().max(500).optional(),
});

export const memberSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  userId: z.string().trim().min(1).max(128),
  role: z.enum(["OWNER", "COORDINATOR", "VIEWER"]),
});

export const memberResponseSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  response: z.enum(["ACCEPT", "DECLINE"]),
});

export const adminReviewSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  status: z.enum(["VERIFIED", "SUSPENDED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});
