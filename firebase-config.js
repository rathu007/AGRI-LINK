// ============================================================
// AGRI-LINK — Firebase config (agri-link-007 project)
// Shared by both farmer-app and buyer-app — that's what keeps
// their data in sync.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyD6QCf_31kKuHYKjuuHb5kQyps048NwMVw",
  authDomain: "agri-link-007.firebaseapp.com",
  projectId: "agri-link-007",
  storageBucket: "agri-link-007.firebasestorage.app",
  messagingSenderId: "938852983623",
  appId: "1:938852983623:web:77a00b814fe889ef20e262"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// Note: no firebase.storage() here — Storage needs the paid Blaze plan,
// so photos are stored directly in Firestore instead. See FIREBASE_SETUP.md.
