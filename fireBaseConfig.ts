import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkfrUtF18Ar6dNeplUuZdnmL8YhF9eVhA",
  authDomain: "training-room-e2395.firebaseapp.com",
  projectId: "training-room-e2395",
  storageBucket: "training-room-e2395.firebasestorage.app",
  messagingSenderId: "212624438219",
  appId: "1:212624438219:web:11e225534bd8176709fc4e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

