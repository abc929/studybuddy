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
const parentView = document.getElementById('mom');
const parentTab = document.querySelector('[data-view="mom"]');
function setParentAccess(enabled) {
  if (parentTab) parentTab.hidden = !enabled;
  if (parentView) {
    parentView.hidden = !enabled;
    if (!enabled && parentView.classList.contains('active')) {
      parentView.classList.remove('active');
      document.getElementById('today')?.classList.add('active');
      document.querySelector('[data-view="today"]')?.classList.add('active');
    }
  }
  document.querySelectorAll('#momGradeDashboard').forEach(el => { el.hidden = !enabled; });
  // Parent accounts land on Mom's View but retain access to the other tabs.
  // Cloud write permissions remain controlled separately by Firebase rules.
  document.querySelectorAll('.tab').forEach(tab => { tab.hidden = false; });
  document.querySelectorAll('.view').forEach(view => { view.hidden = false; });
  if (parentTab) parentTab.hidden = !enabled;
  if (parentView) parentView.hidden = !enabled;
  if (enabled) {
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === 'mom'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === parentTab));
    window.scrollTo(0, 0);
  }
}
setParentAccess(false);
const configured = ['apiKey', 'authDomain', 'projectId', 'appId']
  .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

if (!configured) {
  status('Cloud sync is not configured yet. Your progress still saves on this device.');
  if (signInButton) signInButton.disabled = true;
} else {
  const version = '12.4.0';
  status('Cloud connection code loaded · diagnostic v2');
  const base = `https://www.gstatic.com/firebasejs/${version}`;
  try {
    const [appSdk, authSdk, dbSdk] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-auth.js`),
      import(`${base}/firebase-firestore.js`)
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    // Probe Firebase Auth directly to distinguish a rejected key from browser sign-in failures.
    async function checkAuthConfiguration() {
      try {
        const endpoint = 'https://identitytoolkit.googleapis.com/v1/projects?key=' + encodeURIComponent(firebaseConfig.apiKey);
        const response = await fetch(endpoint, {cache:'no-store'});
        const result = await response.json();
        if (!response.ok) {
          const detail = result?.error?.message || ('HTTP ' + response.status);
          status('Firebase Auth configuration check failed: ' + detail + '.');
          return false;
        }
        return true;
      } catch (error) {
        status('Could not contact Firebase Authentication. Check network access and retry.');
        return false;
      }
    }
    status('Firebase app loaded · checking Auth initialization');
    const auth = authSdk.getAuth(app);
    const db = dbSdk.getFirestore(app);
    status('Firebase initialized · ready for Google sign-in');
    // Do not force persistence before the user initiates sign-in: a failed Auth init can block diagnostics.
    // Firebase Auth uses browser-local persistence by default on supported browsers.
    const provider = new authSdk.GoogleAuthProvider();
    let stopListening = null;
    let writeChain = Promise.resolve();
    let currentUid = null;
    const hasActivity = (state) => Boolean(state && (
      (state.sessions || []).length ||
      Object.values(state.tasks || {}).some(Boolean) ||
      Number(state.stars) > 0 ||
      Object.keys(state.mathDaily || {}).length ||
      Object.keys(state.gratitude || {}).length ||
      Object.keys(state.gratitudeHistory || {}).length ||
      Object.keys(state.subjectFlow?.done?.math || {}).length ||
      Object.keys(state.subjectFlow?.done?.tg || {}).length ||
      Object.keys(state.subjectFlow?.done?.bju || {}).length ||
      Object.keys(state.bjuAnswers || {}).length ||
      (state.chapterAssessments || []).length ||
      (state.readingLog || []).length ||
      (state.libraryBooks || []).length ||
      Object.keys(state.scienceFair?.answers || {}).length ||
      (state.scienceFair?.trials || []).some(value => value !== '') ||
      state.scienceFair?.dueDate
    ));


    // Migrate gratitude and reading records that were previously only on a student device.
    // Parent view must never merge the parent's local browser data into student work.
    function mergeStudentData(remote, local) {
      const combined = {...local, ...remote};
      const old = {...(local?.gratitude || {})};
      try {
        for (let i=0; i<localStorage.length; i++) {
          const key=localStorage.key(i);
          if (!/^cloudberry-gratitude-\d{4}-\d{2}-\d{2}$/.test(key||'')) continue;
          const date=key.slice('cloudberry-gratitude-'.length),value=(localStorage.getItem(key)||'').trim();
          if (value && !old[date]) old[date]=value;
        }
      } catch (e) { console.warn('Local gratitude migration unavailable',e); }
      combined.gratitude={...old,...(remote?.gratitude||{})};
      combined.gratitudeHistory={...(local?.gratitudeHistory||{}),...(remote?.gratitudeHistory||{})};
      for (const [day,entry] of Object.entries(local?.gratitudeHistory||{})) {
        const cloud=remote?.gratitudeHistory?.[day];
        if (!cloud || (entry?.savedAt && String(entry.savedAt)>String(cloud.savedAt||''))) {
          combined.gratitudeHistory[day]=entry;
          if (entry?.text) combined.gratitude[day]=entry.text;
        }
      }
      for (const key of ['bjuAnswers','taskDates','dailyPlanChecks','dailyPlanRoutine']) {
        combined[key]={...(local?.[key]||{}),...(remote?.[key]||{})};
      }
      combined.subjectFlow={...(local?.subjectFlow||{}),...(remote?.subjectFlow||{})};
      combined.subjectFlow.done={};
      for (const sub of ['math','tg','bju']) {
        combined.subjectFlow.done[sub]={...(local?.subjectFlow?.done?.[sub]||{}),...(remote?.subjectFlow?.done?.[sub]||{})};
      }
      combined.subjectFlow.practiceGrades={...(local?.subjectFlow?.practiceGrades||{}),...(remote?.subjectFlow?.practiceGrades||{})};
      for (const field of ['readingGrades','readingLog','libraryBooks','chapterAssessments']) {
        const merged=new Map();
        for (const item of [...(local?.[field]||[]),...(remote?.[field]||[])]) {
          if (!item||typeof item!=='object')continue;
          const key=item.id || [item.title||item.chapter,item.date||item.at||'',item.author||''].join('|');
          merged.set(key,item);
        }
        combined[field]=[...merged.values()];
      }
      return combined;
    }

    signInButton?.addEventListener('click', async () => {
      try {
        status('Checking Firebase Authentication…');
        if (!await checkAuthConfiguration()) return;
        status('Firebase key check passed · opening Google sign-in');
        status('Opening Google sign-in… If a new window appears, complete sign-in there.');
        try {
          await authSdk.signInWithPopup(auth, provider);
        } catch (popupError) {
          if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(popupError.code)) {
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
          'auth/invalid-api-key': 'Firebase rejected the app configuration. Please report this error.',
          'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase rejected the app configuration. Please report this error.',
          'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for StudyBuddy, then try again.',
          'auth/web-storage-unsupported': 'This browser is blocking sign-in storage. Enable cookies/site data for StudyBuddy.',
          'auth/unauthorized-continue-uri': 'The Google return URL is not authorized in Firebase.'
        };
        status((messages[error.code] || 'Google sign-in failed.') + ' [Step: Google popup; code: ' + (error.code || 'unknown') + '; details: ' + String(error.message || '').slice(0,180) + ']');
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

    // Test signals live in a separate Firestore document and never touch student state.
    const testRef = dbSdk.doc(db, 'syncTests', 'cloudberry-parent');
    let signedInRole = null;
    const testStatus = document.getElementById('syncTestStatus');
    const testMessage = message => { if (testStatus) testStatus.textContent = message; };
    document.getElementById('syncTestWrite')?.addEventListener('click', async () => {
      if (signedInRole !== 'parent') { testMessage('Parent account required.'); return; }
      try {
        const signal = 'TEST-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        await dbSdk.setDoc(testRef, { signal, sentAt: dbSdk.serverTimestamp(), sentBy: auth.currentUser.uid });
        testMessage('Test signal sent: ' + signal + '. Open Mom’s View on your other device and tap Check test signal.');
      } catch (e) { console.error(e); testMessage('Test failed: permission or connection problem. No schoolwork was changed.'); }
    });
    document.getElementById('syncTestRead')?.addEventListener('click', async () => {
      if (signedInRole !== 'parent') { testMessage('Parent account required.'); return; }
      try {
        const snap = await dbSdk.getDocFromServer(testRef);
        testMessage(snap.exists() ? 'Cloud test signal received: ' + snap.data().signal : 'No test signal found yet.');
      } catch (e) { console.error(e); testMessage('Could not read test signal. Check Firestore permissions and connection.'); }
    });
    authSdk.getRedirectResult(auth).catch(error => {
      console.error(error);
      status('Google redirect sign-in failed: ' + (error.code || 'unknown error') + '.');
    });
    authSdk.onAuthStateChanged(auth, async (user) => {
      if (stopListening) stopListening();
      stopListening = null;
      currentUid = user?.uid || null;
      signedInRole = null;
      document.documentElement.dataset.cloudRole = 'signed-out';
      setSignedIn(user);
      setParentAccess(false);
      if (!user) {
        status('Gabriella signs in with her student Google account; Angela uses her separate parent account.');
        return;
      }
      status('Checking account permissions…');
      try {
        const accessSnap = await dbSdk.getDoc(dbSdk.doc(db, 'access', user.uid));
        const role = accessSnap.exists() ? accessSnap.data()?.role : null;
        if (!['student', 'parent'].includes(role)) {
          status('This Google account has not been assigned a StudyBuddy role. Ask Angela to finish account setup.');
          return;
        }
        signedInRole = role;
        document.documentElement.dataset.cloudRole = role;
        setParentAccess(role === 'parent');
        if (role === 'parent') window.dispatchEvent(new Event('cloudberry:parent-connected'));
        const ref = dbSdk.doc(db, 'classrooms', 'cloudberry', 'students', 'gabriella');
        if (role === 'parent') {
          const parentSnap = await dbSdk.getDoc(ref);
          if (parentSnap.exists() && window.cloudberryStateApi?.importState) {
            window.cloudberryStateApi.importState(parentSnap.data()?.state || {});
          }
          window.dispatchEvent(new Event('cloudberry:parent-connected'));
          stopListening = dbSdk.onSnapshot(ref, snap => {
            if (snap.exists() && window.cloudberryStateApi?.importState) {
              window.cloudberryStateApi.importState(snap.data()?.state || {});
            }
            window.dispatchEvent(new Event('cloudberry:parent-connected'));
            status('Parent view connected · read-only progress');
          }, error => { console.error(error); status('Could not load parent view. Check account permissions and Firestore rules.'); });
          return;
        }
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
            const merged = mergeStudentData(remote, local);
            window.cloudberryStateApi.importState(merged);
            if (JSON.stringify(merged) !== JSON.stringify(remote)) {
              writeChain=writeChain.then(()=>dbSdk.setDoc(ref,{
                state:merged,updatedAt:dbSdk.serverTimestamp()
              })).catch(error=>{console.error(error);status('Older schoolwork is still on this device but could not upload yet.');});
            }
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
      // Only the signed-in STUDENT can write the Gabriella document. Tab visibility is not an authorization signal.
      if (!currentUid || signedInRole !== 'student' || !event.detail) return;
      const uid = currentUid;
      const ref = dbSdk.doc(db, 'classrooms', 'cloudberry', 'students', 'gabriella');
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
    status('Firebase initialization failed: ' + (error.code || 'unknown') + ' · ' + String(error.message || '').slice(0,200) + '. Local saving still works.');
    if (signInButton) signInButton.disabled = true;
  }
}
