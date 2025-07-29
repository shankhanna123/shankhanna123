// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDt-pibaL2pMEu19Qgbcl4ir68W8lfqti8",
  authDomain: "attendance-d7de7.firebaseapp.com",
  databaseURL: "https://attendance-d7de7-default-rtdb.firebaseio.com",
  projectId: "attendance-d7de7",
  storageBucket: "attendance-d7de7.appspot.com",
  messagingSenderId: "470494624998",
  appId: "1:470494624998:web:be5b5bdfb9b515d079cf27"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const database = getDatabase(app);
const auth = getAuth(app);

// Export them to use in other files
export { app, database, auth };
