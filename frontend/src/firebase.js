import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArr-2MYhUUZ6UAYYxZiIdoHg4vrG6Sakg",
  authDomain: "timesheet-1cd65.firebaseapp.com",
  projectId: "timesheet-1cd65",
  storageBucket: "timesheet-1cd65.firebasestorage.app",
  messagingSenderId: "361230218341",
  appId: "1:361230218341:web:653dbbae7ce99cd715428c",
  measurementId: "G-1ZGZLG5NEK"
};
// Initialize Firebase if it hasn't been already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
