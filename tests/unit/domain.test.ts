import { describe, expect, it } from "vitest";
import { isExactAvailableCandidate } from "@/lib/domain";
import {
  canRespondToMatch,
  canRevealMatch,
  notificationContainsPrivateData,
} from "@/lib/lifecycle";

describe("minimal matching policy", () => {
  const request = { bloodTypeNeeded: "O+", status: "ACTIVE" };

  it("includes an active, available donor with the exact requested type", () => {
    expect(isExactAvailableCandidate({
      bloodType: "O+",
      availability: "AVAILABLE_NOW",
      accountState: "ACTIVE",
    }, request)).toBe(true);
  });

  it.each([
    ["different blood type", { bloodType: "O-", availability: "AVAILABLE_NOW", accountState: "ACTIVE" }],
    ["paused", { bloodType: "O+", availability: "PAUSED", accountState: "ACTIVE" }],
    ["suspended", { bloodType: "O+", availability: "AVAILABLE_NOW", accountState: "SUSPENDED" }],
  ])("excludes %s donors", (_name, donor) => {
    expect(isExactAvailableCandidate(donor, request)).toBe(false);
  });
});

describe("consent and expiration", () => {
  const future = 2_000;
  const now = 1_000;

  it("does not equate a pending match with consent", () => {
    expect(canRevealMatch("PENDING", true, future, now)).toBe(false);
  });

  it("allows reveal only to an accepted, unexpired participant", () => {
    expect(canRevealMatch("ACCEPTED", true, future, now)).toBe(true);
    expect(canRevealMatch("ACCEPTED", false, future, now)).toBe(false);
    expect(canRevealMatch("ACCEPTED", true, now, now)).toBe(false);
  });

  it("only permits one response while both match and request are active", () => {
    expect(canRespondToMatch("PENDING", "ACTIVE", future, now)).toBe(true);
    expect(canRespondToMatch("ACCEPTED", "ACTIVE", future, now)).toBe(false);
    expect(canRespondToMatch("PENDING", "CANCELLED", future, now)).toBe(false);
  });
});

describe("notification privacy", () => {
  it("accepts a coarse notification", () => {
    expect(notificationContainsPrivateData("O+ blood is needed near Kamayut.")).toBe(false);
  });

  it.each([
    "Call +95 912345678 now",
    "Go to 16.81234, 96.12345",
    "Read the private message in this notification",
  ])("rejects private payload: %s", (content) => {
    expect(notificationContainsPrivateData(content)).toBe(true);
  });
});
