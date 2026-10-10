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

    signInButton?.addEventListener('click', async () => {
      try {
        status('Opening Google sign-in…');
        await authSdk.signInWithRedirect(auth, provider);
      } catch (error) {
        console.error(error);
        status('Sign-in did not open. Please try again.');
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
          if (remote && window.cloudberryStateApi?.importState) {
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
