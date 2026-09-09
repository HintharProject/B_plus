# Manual setup

The application can be reviewed without external services. Keep `NEXT_PUBLIC_ENABLE_FIREBASE=false` until the development project and restrictive rules are ready.

## 1. Create the Firebase development project

Why: account, request, match, consent, chat, and audit data need an isolated development environment.

1. Sign in to the Firebase console and create a project for development.
2. Do not enable Google Analytics for development unless you have approved an analytics/privacy policy.
3. Create Firestore in Native mode.
4. Select Singapore (`asia-southeast1`) as the database location. The location is difficult to change later.
5. Stay on the Spark plan. Do not enable phone authentication or deploy Cloud Functions; both require billing for this design.
6. Register a Web app and copy its public web configuration into `.env.local`.

The Firebase web configuration is browser-public metadata. It is not an Admin credential, but it still belongs in environment configuration instead of source files.

## 2. Configure free authentication

1. Open Authentication > Sign-in method.
2. Enable Email/Password.
3. Enable Google and choose the project support email.
4. Do not enable Phone while using the free plan.
5. Add `localhost`, the Vercel preview domain, and the final custom domain under Authorized domains.
6. Customize and human-review the verification email template and action URL.

Email/password and Google authentication are selected for free-plan V1. Firebase quotas still apply.

## 3. Install and deploy restrictive Firebase configuration

Java is required by the local Firestore emulator.

```text
npm install
npm --prefix functions install
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Select only the development project during setup. Review `firestore.rules` before deployment. Never replace it with `allow read, write: if true`.

For local testing:

```text
npm run emulators
npm run test:rules
```

Use fictional Firebase Auth test accounts and synthetic requests only.

## 4. Configure the Vercel free-plan backend

Vercel Route Handlers enforce privileged state changes while Cloud Functions remain undeployed.
Use the step-by-step checklist in `docs/DEPLOYMENT.md` when you are ready to go live.

1. Create or import the Git repository as a Vercel project.
2. Add all `NEXT_PUBLIC_FIREBASE_*` values to Development, Preview, and Production as appropriate.
3. Set `NEXT_PUBLIC_ENABLE_FIREBASE=true`.
4. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` in Preview and Production.
5. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin (update again after a custom domain).
6. In Google Cloud IAM, create a dedicated service account for the Vercel backend with only the permissions required for Firebase Authentication token verification and Firestore access.
7. Store `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` as sensitive Vercel environment variables.
8. Never add those values to Git, source code, screenshots, issue trackers, or chat.
9. Redeploy after environment changes.

The service-account private key is the main free-plan operational risk. Restrict access to the Vercel project, rotate the key periodically, and revoke it immediately if exposed. A later billed deployment should use Cloud Functions managed credentials and remove this long-lived Vercel key.

## 5. Assign the first administrator

There is no public admin registration. Create and verify the intended administrator account normally, copy its Firebase UID, then run from a secured administrator workstation:

```text
npm run admin:set -- FIREBASE_UID confirm
```

The command uses the Admin environment variables or Application Default Credentials. The user must sign out and in again to receive the claim. Confirm the UID carefully; every admin assignment is security-sensitive.

## 6. Create production only after review

Create a separate Firebase production project only after:

- Burmese safety/privacy/consent translations are human-reviewed.
- Blood compatibility, cooldown, and eligibility behavior is reviewed by an appropriate medical authority.
- Terms, privacy policy, consent language, retention/deletion periods, and Myanmar legal considerations are reviewed.
- Organization verification evidence and authorized reviewers are defined.
- Match, reveal, chat, and request expiration policy is approved.
- Abuse response, incident response, and account recovery processes have owners.

## Do not provide to the coding agent or commit

- Service-account JSON/private keys
- Firebase, Google, GitHub, or Vercel passwords/tokens
- Payment information or recovery codes
- Real donor/requester records
- Phone numbers, precise addresses/coordinates, or private chat content

Enter secrets directly into `.env.local` on your machine or Vercel’s encrypted environment settings.
