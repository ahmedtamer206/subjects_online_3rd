/* ===================================================
   SUBJECTS ONLINE — Firebase Configuration
   Project: subjects-online-2
   =================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDEntrpYTMzxZvTSWnXGpMTDsEV2F163M4",
  authDomain: "subjects-online-2.firebaseapp.com",
  projectId: "subjects-online-2",
  storageBucket: "subjects-online-2.firebasestorage.app",
  messagingSenderId: "556893115836",
  appId: "1:556893115836:web:ba0d3ab63c1b4f251ec7b9",
  measurementId: "G-4K9RNGN68M",
};
firebase.initializeApp(firebaseConfig);

function initFirebaseDB() {
  return firebase.firestore();
}
