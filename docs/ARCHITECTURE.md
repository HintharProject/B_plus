# Architecture

## Runtime

```text
Next.js on Vercel
  -> Firebase Authentication (email/password + Google)
  -> Vercel Route Handlers (ID-token verification and authorization)
  -> Cloud Firestore (Singapore)
  -> Firebase Cloud Messaging when device registration is enabled
```

Cloud Functions v2 source is included under `functions/` for emulator use and a future billed migration. It is not the active deployed backend on the Firebase Spark plan because deploying Functions requires billing.

## Collections

- `users`, `userPrivate`, `donorProfiles`
- `bloodRequests`, `requestPrivate`
- `matches`, `consentEvents`
- `organizations`, `organizationMembers`
- `conversations/{id}/messages`
- `notifications`, `deviceTokens`
- `reports`, `blocks`, `rateLimits`, `auditLogs`

Private request data is physically separated from matchable request data. There is no public donor collection.

## Key flows

### Request and matching

1. An individual creates a `PENDING_VERIFICATION` request.
2. An active member of a verified organization may create an `ACTIVE` request.
3. A server endpoint retrieves only exact-type, available donors.
4. The server creates expiring match records and privacy-safe notifications.

### Consent and reveal

1. The candidate reads limited request fields.
2. Only that candidate can submit `ACCEPTED` or `DECLINED`.
3. Acceptance, consent scope, match state, and conversation creation occur in a transaction.
4. A separate reveal endpoint rechecks status, participant, and expiry before returning the precise facility destination to the donor.
5. Every reveal is audited. No donor precise location or phone number is revealed.

### Organizations and administration

1. A user registers an organization in `PENDING`.
2. Only a server-issued platform administrator can verify, reject, or suspend it.
3. Organization owners manage members; sensitive actions recheck membership server-side.
4. Admin actions and organization reviews are audited.

## Localization

`src/messages/my.json` is the default dictionary and `src/messages/en.json` is the English dictionary. Product owners can edit either JSON file without changing components. Critical Burmese safety, privacy, medical, and consent text must be professionally reviewed.

## Offline and low bandwidth

- Mapbox is not loaded by the core application.
- The request form keeps a non-sensitive local draft, excluding the precise destination.
- Sensitive actions are never treated as successful until the server confirms them.
- Chat polling pauses while the page is hidden.
- Routes use simple CSS and icons without image payloads.
