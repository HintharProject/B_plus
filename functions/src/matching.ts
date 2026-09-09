export type MatchableDonor = {
  id: string;
  bloodType: string;
  availability: "AVAILABLE_NOW" | "AVAILABLE_TODAY" | "PAUSED";
  accountState: "ACTIVE" | "SUSPENDED";
};

export type MatchableRequest = {
  bloodTypeNeeded: string;
  status: "ACTIVE" | "CANCELLED" | "CLOSED" | "EXPIRED";
};

/**
 * V1 intentionally uses exact blood type and stated availability only.
 * It does not decide medical eligibility or apply an unreviewed cooldown.
 */
export function isMinimalCandidate(donor: MatchableDonor, request: MatchableRequest) {
  return request.status === "ACTIVE"
    && donor.accountState === "ACTIVE"
    && donor.availability !== "PAUSED"
    && donor.bloodType === request.bloodTypeNeeded;
}

export function rankAvailability(availability: MatchableDonor["availability"]) {
  switch (availability) {
    case "AVAILABLE_NOW":
      return 0;
    case "AVAILABLE_TODAY":
      return 1;
    case "PAUSED":
      return 2;
  }
}

export function selectCandidates(
  donors: MatchableDonor[],
  request: MatchableRequest,
  limit = 50,
) {
  return donors
    .filter((donor) => isMinimalCandidate(donor, request))
    .sort((a, b) => rankAvailability(a.availability) - rankAvailability(b.availability))
    .slice(0, limit);
}
