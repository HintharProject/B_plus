# B+ Myanmar Blood Donation Coordination

B+ is a privacy-first coordination platform for blood requests, individual donors, and verified organizations in Myanmar.

The central rule is:

`REQUEST → MATCH → LIMITED INFORMATION → EXPLICIT ACCEPTANCE → CONSENT → REVEAL → CONNECT`

A match is not consent. B+ does not determine medical eligibility or replace a hospital.

## Stack

- Next.js 15, React 19, strict TypeScript, Tailwind CSS
- Firebase Authentication (email/password and Google on the free plan)
- Cloud Firestore with deny-by-default rules
- Vercel Route Handlers as the free-plan privileged backend
- Optional Cloud Functions v2 implementation for a future Blaze-plan deployment
- Vitest, Firebase Rules Unit Testing, and Playwright

## Local development

1. Install Node.js 22 and Java.
2. Run `npm install` and `npm --prefix functions install`.
3. Copy `.env.example` to `.env.local`.
4. Keep `NEXT_PUBLIC_ENABLE_FIREBASE=false` to review public pages without Firebase.
5. For full local workflows, follow `docs/MANUAL_SETUP.md`, then run `npm run emulators` and `npm run dev` in separate terminals.

## Quality commands

```text
npm run typecheck
npm run lint
npm run test
npm run test:rules
npm run test:e2e
npm run build
npm --prefix functions run build
```

## Safety

- Never commit `.env.local`, service-account keys, access tokens, phone numbers, precise coordinates, or chat content.
- Do not use real patient or donor information in development.
- Burmese safety, privacy, consent, and medical-boundary text requires qualified human review before production.
- See `docs/SECURITY.md` and `docs/MANUAL_SETUP.md` before connecting a real Firebase project.
