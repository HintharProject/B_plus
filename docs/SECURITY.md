# Security and privacy model

## Trust boundaries

- The browser is untrusted. It cannot assign roles, verify organizations, create matches, record consent, reveal private data, or write audit events directly.
- Vercel Route Handlers verify a fresh Firebase ID token and authorize every privileged operation.
- Firestore rules deny writes from browser clients. Direct reads are limited to the owner, match participants, active organization members, or server-issued administrators.
- The optional Cloud Functions implementation uses the same server-only model but must not be deployed while the project is restricted to the Firebase free plan.

## Data classification

Public:

- Platform guidance
- Verified organization name, type, description, and coarse location

Authenticated private:

- A user’s own profile, donor settings, requests, matches, and notifications
- Match-scoped messages visible only to participants

Consent-gated:

- The precise donation destination is stored separately in `requestPrivate`
- It is returned only to the intended donor after that donor explicitly accepts an active, unexpired match
- Requesters do not receive a donor’s precise location
- V1 uses in-app chat and does not reveal phone numbers

Restricted:

- Firebase identifiers, device tokens, moderation reports, blocks, organization verification material, rate-limit records, and audit logs

## Authorization invariants

1. `PENDING` is not `ACCEPTED`.
2. Only the match candidate can accept or decline.
3. The request and match must both be active and unexpired.
4. A conversation is created only in the same server transaction that records acceptance and consent.
5. Reveal requires an accepted match, current participation, and an unexpired timestamp.
6. Organization verification and admin claims cannot be self-assigned.
7. Storage uploads are denied in V1.

## Medical boundary

V1 candidate retrieval uses only:

- Exact requested blood type
- Donor-stated availability
- Active account state

The last donation date is informational and does not automatically block or approve a donor. B+ does not claim that a donor is eligible or that blood is medically compatible. The receiving facility must confirm all medical decisions.

## Abuse controls

- Server-side input validation and bounded text lengths
- Per-user server-side limits for matching, match responses, reveal, messages, reports, and organization creation
- Reporting and blocking records
- Verified organizations required before an organization request can notify donors
- Append-only server audit events
- No private data in notification text
- Deny-by-default Firestore and Storage rules

Rate limiting uses Firestore counters and is an initial defense, not a substitute for edge/WAF controls. Add Vercel Firewall or another approved control before a high-risk public launch.

## Logging

Application logs must contain only safe event names, error classes, and opaque resource IDs. Never log:

- Email addresses or future phone numbers
- Precise locations
- Chat content
- Firebase ID tokens or service-account credentials
- Patient details

## Known pre-production blockers

- Human review of Burmese translations and all legal/consent copy
- Approved retention, deletion, match/reveal/chat expiration policies
- Organization verification procedure
- Incident response and administrator access procedure
- Full emulator integration test run
- Production dependency, accessibility, and penetration testing
