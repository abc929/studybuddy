# Cloudberry Study Buddy

A mobile-friendly homeschool study companion for Gabriella and Cloudberry Academy.

## What it does

- Organizes daily homeschool goals and offers practice questions, hints, and adjustable challenge levels.
- Uses a small on-device adaptive model to estimate skill readiness from answers, hint use, and confidence. This is a simple practice model, not a general-purpose AI tutor.
- Shows skill estimates and practice history in Mom’s view.
- Saves locally by default. With Firebase configured, it securely syncs progress between signed-in devices.

## Enable private cloud sync

The app uses Firebase Authentication with Google sign-in and Cloud Firestore. The Google account is the family’s private key: use the same adult caregiver account on Gabriella’s study device and Mom’s device. Sign in on Gabriella’s device first so its existing local progress creates the initial cloud profile. Then sign in on Mom’s device to see updates live.

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web app** in Project settings. Copy its Firebase web config into `firebase-config.js` (`apiKey`, `authDomain`, `projectId`, and `appId` are required).
3. In **Authentication → Sign-in method**, enable **Google**.
4. In **Firestore Database**, create a database in **production mode**.
5. In Firestore **Rules**, publish the contents of this repository’s `firestore.rules`.
6. In Authentication **Settings → Authorized domains**, add `abc929.github.io`.
7. Commit the Firebase web config to `firebase-config.js`, then wait for GitHub Pages to redeploy.
8. Open the app on Gabriella’s device, choose **Connect with Google**, and sign into the caregiver account. Then open the app on Mom’s device and use that same account.

Firebase web config values identify the Firebase project and are intended to be present in a web app. **Never put a service-account JSON file, private key, or other server credential in this public repository.** Access is enforced by Firestore Security Rules: each signed-in user can read and write only their own `profiles/{uid}` document; all other documents are denied. Do not replace these rules with public read/write rules.

Progress includes the checklist, skill estimates, study streaks, and the latest 50 practice attempts. The note to Mom stays on the device. The app does not upload homework text or location.

## Privacy and setup notes

- Until Firebase is configured, the app continues saving only in the current browser. Share snapshot is still available as a manual option; anyone with that link can read its snapshot.
- The Firebase profile is private to its Google account. Sign out on a shared device when needed; signing out does not delete the cloud profile.
- A Firebase project is required to turn on cross-device sync. The web config and rules are included here, but they do not create a Firebase account or database automatically.

## Run locally

Open `index.html` from a local web server (for example, GitHub Pages or another HTTPS host). Google sign-in needs an authorized web domain. The study tools work locally without Firebase.

## Math and Science Fair tabs

- Math offers three original daily questions for the selected lesson in the current Chapter 2 assignment (Addition and Subtraction). Its six lesson topics follow the [publisher’s 4A table of contents](https://www.singaporemath.com/products/dimensions-math-textbook-4a). Select the lesson being studied; it stays selected until changed. Answers, hints, written workspaces and scores save with progress and appear in Mom’s view. Existing chapter checks for all nine chapters are now in Math.
- Science Fair retains the Save Our Trees lessons, reflections and measurements. Existing device notes migrate into synced progress. No due date is assumed. Enter the official date when available to calculate milestones 28, 24, 21, 14, 10, 7 and 3 days before the deadline. Daily Plan shows only due tasks and unfinished catch-up tasks; the whole project lives in Science Fair. Completing a task removes it from the daily list. Changing the due date recalculates dates and retains completed work.
- Hispanic Heritage Month appears as an active occasion only September 15 through October 15. Its archived reading and cultural practice remain in Learn. Music and the other learning tools remain available.
- The new schoolwork fields use the existing private student record and parent read-only cloud access. Live cross-device synchronization still requires the existing Firebase roles and rules. Written math work and science reflections are included in that record.

## Checks

With a current Node.js runtime, run `node --test tests/planner.test.cjs` for date boundaries, backward scheduling and generated answer checks. Browser regression checks use Playwright and installed Microsoft Edge: install Playwright as a development tool, then run `node tests/browser.cjs`. Set `PLAYWRIGHT_MODULE` to an absolute Playwright package path if using a bundled runtime. Browser checks use synthetic local progress and block Firebase imports; they never change real student records.
