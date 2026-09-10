import { z } from "zod";

export const bloodTypes = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;
export const urgencies = ["CRITICAL", "URGENT", "STANDARD"] as const;
export const organizationTypes = ["HOSPITAL", "BLOOD_BANK", "CLINIC", "CHARITY", "COMMUNITY"] as const;

export type BloodType = (typeof bloodTypes)[number];
export type Urgency = (typeof urgencies)[number];
export type OrganizationType = (typeof organizationTypes)[number];

export const coarseLocationSchema = z.object({
  stateRegion: z.string().trim().min(2).max(80),
  township: z.string().trim().min(2).max(80),
});

export const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}).optional().nullable();

export const donorProfileInputSchema = z.object({
  bloodType: z.enum(bloodTypes),
  availability: z.enum(["AVAILABLE_NOW", "AVAILABLE_TODAY", "PAUSED"]),
  lastDonationDate: z.union([z.string().date(), z.literal("")]).nullable().transform((value) => value || null),
  coarseLocation: coarseLocationSchema,
  phone: z.string().trim().max(30).optional().nullable().transform((val) => val || null),
  telegram: z.string().trim().max(50).optional().nullable().transform((val) => (val ? val.replace(/^@/, "").trim() : null)),
  coordinates: coordinatesSchema,
});

export const userProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional().nullable().transform((val) => val || null),
  telegram: z.string().trim().max(50).optional().nullable().transform((val) => (val ? val.replace(/^@/, "").trim() : null)),
  locale: z.enum(["my", "en"]).optional(),
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
  coordinates: coordinatesSchema,
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
  coordinates: coordinatesSchema,
});

export const organizationUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  type: z.enum(organizationTypes).optional(),
  coarseLocation: coarseLocationSchema.optional(),
  description: z.string().trim().max(500).optional().nullable(),
  coordinates: coordinatesSchema,
});

/**
 * Medical Red Blood Cell compatibility matrix:
 * Map of recipient blood type to list of compatible donor blood types.
 */
export const BLOOD_COMPATIBILITY: Record<BloodType, readonly BloodType[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal recipient
};

/**
 * Checks if donor blood type can be donated to recipient blood type.
 */
export function canDonateBlood(donorType: string, recipientType: string): boolean {
  const compatibleDonors = BLOOD_COMPATIBILITY[recipientType as BloodType];
  if (!compatibleDonors) return donorType === recipientType;
  return compatibleDonors.includes(donorType as BloodType);
}

/**
 * Compatibility score:
 * 2 = Exact blood type match
 * 1 = Compatible universal donor
 * 0 = Incompatible
 */
export function getBloodCompatibilityScore(donorType: string, recipientType: string): number {
  if (donorType === recipientType) return 2;
  return canDonateBlood(donorType, recipientType) ? 1 : 0;
}

export function isExactAvailableCandidate(
  donor: { bloodType: string; availability: string; accountState: string },
  request: { bloodTypeNeeded: string; status: string },
) {
  return donor.bloodType === request.bloodTypeNeeded
    && donor.availability !== "PAUSED"
    && donor.accountState === "ACTIVE"
    && request.status === "ACTIVE";
}

export function isCompatibleAvailableCandidate(
  donor: { bloodType: string; availability: string; accountState: string },
  request: { bloodTypeNeeded: string; status: string },
) {
  return canDonateBlood(donor.bloodType, request.bloodTypeNeeded)
    && donor.availability !== "PAUSED"
    && donor.accountState === "ACTIVE"
    && request.status === "ACTIVE";
}
