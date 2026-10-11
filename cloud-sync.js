import { firebaseConfig } from './firebase-config.js';

const statusEl = document.getElementById('cloudStatus');
const accountEl = document.getElementById('cloudAccount');
const signInButton = document.getElementById('cloudSignIn');
const signOutButton = document.getElementById('cloudSignOut');

function status(message) {
  if (statusEl) statusEl.textContent = message;
}
function setSignedIn(user) {
  if (signInButton) signInButton.hidden = Boolean(user);
  if (signOutButton) signOutButton.hidden = !user;
  if (accountEl) accountEl.textContent = user ? (user.email || 'Google account') : '';
}
const configured = ['apiKey', 'authDomain', 'projectId', 'appId']
  .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

if (!configured) {
  status('Cloud sync is not configured yet. Your progress still saves on this device.');
  if (signInButton) signInButton.disabled = true;
} else {
  const version = '13.0.0';
  const base = `https://www.gstatic.com/firebasejs/${version}`;
  try {
    const [appSdk, authSdk, dbSdk] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`),
      import(`${base}/firebase-firestore.js`)
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);
    const db = dbSdk.getFirestore(app);
    await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
    const provider = new authSdk.GoogleAuthProvider();
    let stopListening = null;
    let writeChain = Promise.resolve();
    let currentUid = null;
    const hasActivity = (state) => Boolean(state && (
      (state.sessions || []).length ||
      Object.values(state.tasks || {}).some(Boolean) ||
      Number(state.stars) > 0
    ));

    signInButton?.addEventListener('click', async () => {
      try {
        status('Opening Google sign-in…');
        try {
          await authSdk.signInWithPopup(auth, provider);
        } catch (popupError) {
          if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(popupError.code)) {
            status('Popup unavailable. Redirecting to Google sign-in…');
            await authSdk.signInWithRedirect(auth, provider);
          } else {
            throw popupError;
          }
        }
      } catch (error) {
        console.error(error);
        const messages = {
          'auth/unauthorized-domain': 'This website is not authorized in Firebase. Add abc929.github.io under Authentication → Settings → Authorized domains.',
          'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Authentication → Sign-in method.',
          'auth/popup-closed-by-user': 'Google sign-in was closed before finishing. Tap Connect with Google to try again.',
          'auth/network-request-failed': 'Google sign-in could not reach the network. Check your connection and retry.',
          'auth/invalid-api-key': 'Firebase API key was rejected. Check the project configuration.'
        };
        status(messages[error.code] || ('Google sign-in failed: ' + (error.code || 'unknown error') + '. Try opening the site in Chrome.'));
      }
    });
    signOutButton?.addEventListener('click', async () => {
      try {
        await authSdk.signOut(auth);
        status('Signed out. Progress remains saved on this device and in your private cloud profile.');
      } catch (error) {
        console.error(error);
        status('Could not sign out. Please try again.');
      }
    });

    authSdk.getRedirectResult(auth).catch(error => {
      console.error(error);
      status('Google redirect sign-in failed: ' + (error.code || 'unknown error') + '.');
    });
    authSdk.onAuthStateChanged(auth, async (user) => {
      if (stopListening) stopListening();
      stopListening = null;
      currentUid = user?.uid || null;
      setSignedIn(user);
      if (!user) {
        status('Sign in with the same Google account on Gabriella’s device and Mom’s device to sync.');
        return;
      }
      status('Connecting securely…');
      try {
        const ref = dbSdk.doc(db, 'profiles', user.uid);
        const firstRead = await dbSdk.getDoc(ref);
        if (!firstRead.exists()) {
          const local = window.cloudberryStateApi?.exportState?.();
          if (!local) throw new Error('Study progress is not ready.');
          await dbSdk.setDoc(ref, { state: local, updatedAt: dbSdk.serverTimestamp() });
        } else {
          const remote = firstRead.data()?.state;
          const local = window.cloudberryStateApi?.exportState?.();
          if (!hasActivity(remote) && hasActivity(local)) {
            // A blank caregiver-device setup must not erase existing study-device progress.
            await dbSdk.setDoc(ref, { state: local, updatedAt: dbSdk.serverTimestamp() });
          } else if (remote && window.cloudberryStateApi?.importState) {
            window.cloudberryStateApi.importState(remote);
          }
        }
        if (currentUid !== user.uid) return;
        stopListening = dbSdk.onSnapshot(ref, (snap) => {
          if (!snap.exists()) return;
          const remote = snap.data()?.state;
          const local = window.cloudberryStateApi?.exportState?.();
          if (remote && local && JSON.stringify(remote) !== JSON.stringify(local)) {
            window.cloudberryStateApi.importState(remote);
          }
          status('Synced securely · updates appear on your other signed-in device.');
        }, (error) => {
          console.error(error);
          status('Cloud sync paused. Check the Firebase security rules and internet connection.');
        });
      } catch (error) {
        console.error(error);
        status('Could not connect. Check Firebase setup and security rules; local saving still works.');
      }
    });

    window.addEventListener('cloudberry:save', (event) => {
      if (!currentUid || !event.detail) return;
      const uid = currentUid;
      const ref = dbSdk.doc(db, 'profiles', uid);
      const snapshot = JSON.parse(JSON.stringify(event.detail));
      writeChain = writeChain.then(() => {
        if (currentUid !== uid) return;
        status('Saving progress securely…');
        return dbSdk.setDoc(ref, { state: snapshot, updatedAt: dbSdk.serverTimestamp() });
      }).then(() => {
        if (currentUid === uid) status('Saved securely · updates appear on your other signed-in device.');
      }).catch((error) => {
        console.error(error);
        if (currentUid === uid) status('Cloud save failed. Your progress is still saved on this device.');
      });
    });
  } catch (error) {
    console.error(error);
    status('Cloud sync could not start. Local saving still works.');
    if (signInButton) signInButton.disabled = true;
  }
}
