// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDt-pibaL2pMEu19Qgbcl4ir68W8lfqti8",
  authDomain: "attendance-d7de7.firebaseapp.com",
  databaseURL: "https://attendance-d7de7-default-rtdb.firebaseio.com",
  projectId: "attendance-d7de7",
  storageBucket: "attendance-d7de7.appspot.com",
  messagingSenderId: "470494624998",
  appId: "1:470494624998:web:be5b5bdfb9b515d079cf27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Correctly export both
export { auth, db };
