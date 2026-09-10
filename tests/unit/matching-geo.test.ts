import { describe, expect, it } from "vitest";
import {
  canDonateBlood,
  getBloodCompatibilityScore,
  isCompatibleAvailableCandidate,
} from "@/lib/domain";
import {
  getDistanceKm,
  getSearchRadiusKm,
  resolveLocationCoordinates,
  SEARCH_RADIUS_TIERS_KM,
} from "@/lib/geo";

describe("Blood compatibility rules", () => {
  it("allows O- to donate to everyone", () => {
    const allTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
    for (const recipient of allTypes) {
      expect(canDonateBlood("O-", recipient)).toBe(true);
      expect(getBloodCompatibilityScore("O-", recipient)).toBeGreaterThan(0);
    }
  });

  it("allows AB+ to receive from everyone", () => {
    const allTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
    for (const donor of allTypes) {
      expect(canDonateBlood(donor, "AB+")).toBe(true);
    }
  });

  it("prioritizes exact matches with higher score (2) over compatible universal matches (1)", () => {
    expect(getBloodCompatibilityScore("B+", "B+")).toBe(2);
    expect(getBloodCompatibilityScore("O+", "B+")).toBe(1);
    expect(getBloodCompatibilityScore("O-", "B+")).toBe(1);
  });

  it("denies incompatible blood transfers", () => {
    expect(canDonateBlood("A+", "B+")).toBe(false);
    expect(canDonateBlood("B+", "A+")).toBe(false);
    expect(canDonateBlood("AB+", "O+")).toBe(false);
    expect(canDonateBlood("O+", "O-")).toBe(false);
    expect(getBloodCompatibilityScore("A+", "B+")).toBe(0);
  });

  it("evaluates candidate compatibility correctly", () => {
    const activeReq = { bloodTypeNeeded: "B+", status: "ACTIVE" };
    // Exact match
    expect(
      isCompatibleAvailableCandidate(
        { bloodType: "B+", availability: "AVAILABLE_NOW", accountState: "ACTIVE" },
        activeReq,
      ),
    ).toBe(true);

    // Compatible match (O+)
    expect(
      isCompatibleAvailableCandidate(
        { bloodType: "O+", availability: "AVAILABLE_NOW", accountState: "ACTIVE" },
        activeReq,
      ),
    ).toBe(true);

    // Incompatible match (A+)
    expect(
      isCompatibleAvailableCandidate(
        { bloodType: "A+", availability: "AVAILABLE_NOW", accountState: "ACTIVE" },
        activeReq,
      ),
    ).toBe(false);
  });
});

describe("Geographic distance calculation & expansion", () => {
  it("calculates accurate distances using Haversine formula", () => {
    // Kamayut to Sanchaung (adjacent townships in Yangon, ~3 km apart)
    const d = getDistanceKm(16.829, 96.13, 16.804, 96.133);
    expect(d).toBeGreaterThan(2);
    expect(d).toBeLessThan(4);
  });

  it("returns 0 for identical coordinates", () => {
    expect(getDistanceKm(16.8, 96.1, 16.8, 96.1)).toBe(0);
  });

  it("expands search radius tiers correctly", () => {
    expect(SEARCH_RADIUS_TIERS_KM).toEqual([3, 5, 10, 20, 50, 100, 1000]);
    expect(getSearchRadiusKm(0)).toBe(3);
    expect(getSearchRadiusKm(1)).toBe(5);
    expect(getSearchRadiusKm(2)).toBe(10);
    expect(getSearchRadiusKm(3)).toBe(20);
    expect(getSearchRadiusKm(4)).toBe(50);
    expect(getSearchRadiusKm(5)).toBe(100);
    expect(getSearchRadiusKm(6)).toBe(1000);
    expect(getSearchRadiusKm(10)).toBe(1000); // capped at maximum
  });

  it("resolves built-in Myanmar coordinates accurately", () => {
    const kamayut = resolveLocationCoordinates("Kamayut", "Yangon");
    expect(kamayut).not.toBeNull();
    expect(kamayut?.latitude).toBeCloseTo(16.829, 2);
    expect(kamayut?.longitude).toBeCloseTo(96.13, 2);

    const chanayethazan = resolveLocationCoordinates("Chanayethazan", "Mandalay");
    expect(chanayethazan).not.toBeNull();
    expect(chanayethazan?.latitude).toBeCloseTo(21.975, 2);

    // Prefer explicit coordinates if supplied
    const explicit = resolveLocationCoordinates("Kamayut", "Yangon", {
      latitude: 16.999,
      longitude: 96.999,
    });
    expect(explicit?.latitude).toBe(16.999);
  });
});
