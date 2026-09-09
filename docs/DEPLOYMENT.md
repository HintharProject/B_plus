# Deployment guide (Vercel + Firebase Spark)

Deploy the Next.js app on Vercel. Keep privileged work in Vercel Route Handlers.
Do **not** deploy Cloud Functions while the Firebase project is on the free Spark plan.

## What the coding agent prepared in the repo

- Production security headers and CSP in `next.config.ts`
- Singapore Vercel region (`sin1`) in `vercel.json` to stay close to Firestore
- Lazy Firebase Admin initialization so `next build` can complete without secrets
- Lint clean-up so `npm run verify` can pass
- This checklist and the environment table below

You still have to create cloud projects, paste secrets, and click deploy yourself.
Never paste service-account keys, private keys, or passwords into chat.

## Pre-flight (run locally)

```text
npm install
npm --prefix functions install
npm run verify
```

Optional:

```text
npm run test:rules
npm run test:e2e
```

## Manual steps you must complete

### A. Firebase project

1. Create a **development** Firebase project (and later a separate production project).
2. Create Firestore in Native mode in **Singapore (`asia-southeast1`)**.
3. Stay on Spark. Do not enable Phone Auth or deploy Functions.
4. Register a Web app and copy the public config values.
5. Authentication → enable **Email/Password** and **Google**.
6. Authentication → Authorized domains: add `localhost`, your Vercel domains, and any custom domain.
7. (Optional push) Cloud Messaging → Web Push certificates → copy the VAPID key.
8. From a trusted machine, with Firebase CLI logged in:

```text
npx firebase-tools login
npx firebase-tools use YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Review `firestore.rules` first. Never deploy open rules.

### B. Google Cloud service account for Vercel

1. In Google Cloud Console for the same project, create a dedicated service account
   (example name: `b-plus-vercel-admin`).
2. Grant only what this backend needs (typically Firebase Admin / Firestore access for the project).
   Prefer the least privilege your org will approve.
3. Create a JSON key **once**, store it in a password manager, then delete the downloaded file
   from disk after you paste values into Vercel.
4. You will need:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep `\n` newlines as the literal two-character sequence `\n` inside the Vercel value, or paste the PEM with real newlines if the Vercel UI preserves them)

Rotate this key if it is ever exposed. Restrict who can access the Vercel project.

### C. Vercel project

1. Push this repository to GitHub/GitLab/Bitbucket (private recommended).
2. Import the repo in Vercel → Framework Preset: Next.js → Deploy.
3. Set environment variables for **Preview** and **Production** (and Development if you use `vercel dev`):

| Variable | Production value | Notes |
|---|---|---|
| `NEXT_PUBLIC_ENABLE_FIREBASE` | `true` | Required for live auth/data |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | `false` | Must be false on Vercel |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase web config | Public |
| `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION` | `asia-southeast1` | Reserved for later Functions |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain` | Used in push notification links |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push key | Optional until push is enabled |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token | Optional; restrict URL in Mapbox |
| `FIREBASE_ADMIN_PROJECT_ID` | service account project | **Secret** |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | service account email | **Secret** |
| `FIREBASE_ADMIN_PRIVATE_KEY` | service account private key | **Secret** |

4. Redeploy after saving env vars.
5. After the first successful deploy, copy the Vercel URL into Firebase Authorized domains
   and set `NEXT_PUBLIC_APP_URL` to that URL (or your custom domain), then redeploy.

### D. First administrator

1. Sign up in the live app and verify email.
2. Copy that user’s Firebase Auth UID from the Firebase console.
3. On a secured workstation with Admin env vars loaded:

```text
npm run admin:set -- FIREBASE_UID --confirm
```

4. Sign out and sign in again so the admin claim is present.
5. Confirm `/admin` loads for that account only.

### E. Post-deploy smoke checks

- Public pages load: `/`, `/about`, `/how-it-works`, `/safety`, `/login`
- Email/password and Google sign-in work
- Account bootstrap creates a profile (`/dashboard`)
- Create a fictional blood request
- Register an organization (stays `PENDING` until an admin verifies it)
- Admin can open `/admin` and review the org
- Match → accept → reveal → chat still hides precise destination until reveal
- Push opt-in only if VAPID is configured

### F. Production launch blockers (human work)

Do not treat a technical deploy as a public launch until these are done:

- Human review of Burmese safety, privacy, consent, and medical-boundary copy
- Legal review of terms, privacy, retention/deletion, Myanmar requirements
- Organization verification process and named reviewers
- Incident response / key rotation / admin recovery owners
- Abuse response path for reports and blocks
- Prefer a separate Firebase **production** project from development

## What not to deploy yet

- `functions/` Cloud Functions (requires Blaze billing)
- Open Firestore or Storage rules
- Real patient/donor data in development
- Long-lived Admin keys in git, screenshots, tickets, or chat

## Rollback

1. In Vercel, promote the previous successful deployment.
2. If rules were wrong, redeploy the last known-good `firestore.rules` / `storage.rules`.
3. If the service-account key leaked, disable the key in Google Cloud immediately, create a new key, update Vercel, redeploy.
