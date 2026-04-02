// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6zrfGsgiebnq9n8oj0f72qjc3-6un4jM",
  authDomain: "monthly-spender.firebaseapp.com",
  projectId: "monthly-spender",
  storageBucket: "monthly-spender.firebasestorage.app",
  messagingSenderId: "47128927889",
  appId: "1:47128927889:web:160402983c0387f037e930",
  measurementId: "G-F1Y67W1LZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
