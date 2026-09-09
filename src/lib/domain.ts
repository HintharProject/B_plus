import { z } from "zod";

export const bloodTypes = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;
export const urgencies = ["CRITICAL", "URGENT", "STANDARD"] as const;
export const organizationTypes = ["HOSPITAL", "BLOOD_BANK", "CLINIC", "CHARITY", "COMMUNITY"] as const;

export type BloodType = (typeof bloodTypes)[number];
export type Urgency = (typeof urgencies)[number];

export const coarseLocationSchema = z.object({
  stateRegion: z.string().trim().min(2).max(80),
  township: z.string().trim().min(2).max(80),
});

export const donorProfileInputSchema = z.object({
  bloodType: z.enum(bloodTypes),
  availability: z.enum(["AVAILABLE_NOW", "AVAILABLE_TODAY", "PAUSED"]),
  lastDonationDate: z.union([z.string().date(), z.literal("")]).nullable().transform((value) => value || null),
  coarseLocation: coarseLocationSchema,
});

export const bloodRequestInputSchema = z.object({
  bloodTypeNeeded: z.enum(bloodTypes),
  urgency: z.enum(urgencies),
  coarseLocation: coarseLocationSchema,
  hospital: z.string().trim().min(2).max(160),
  neededBy: z.string().datetime(),
  expiresAt: z.string().datetime(),
  unitsRequired: z.number().int().min(1).max(10),
  additionalInstructions: z.string().trim().max(500).optional(),
  organizationId: z.string().trim().min(1).max(128).nullable().optional(),
  preciseDestination: z.object({
    address: z.string().trim().min(3).max(240),
  }).optional(),
}).refine((value) => new Date(value.expiresAt) > new Date(), {
  path: ["expiresAt"],
  message: "Expiration must be in the future.",
}).refine((value) => new Date(value.expiresAt) <= new Date(value.neededBy), {
  path: ["expiresAt"],
  message: "Matching must stop by the needed-by time.",
});

export const organizationInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(organizationTypes),
  coarseLocation: coarseLocationSchema,
  description: z.string().trim().max(500).optional(),
});

export function isExactAvailableCandidate(
  donor: { bloodType: string; availability: string; accountState: string },
  request: { bloodTypeNeeded: string; status: string },
) {
  return donor.bloodType === request.bloodTypeNeeded
    && donor.availability !== "PAUSED"
    && donor.accountState === "ACTIVE"
    && request.status === "ACTIVE";
}
