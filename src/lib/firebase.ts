import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBolwnTvHED1YcdAuOSdMR-7lfCcI13pco",
    authDomain: "divvy-2ea98.firebaseapp.com",
    projectId: "divvy-2ea98",
    storageBucket: "divvy-2ea98.firebasestorage.app",
    messagingSenderId: "793867025439",
    appId: "1:793867025439:web:a12f49407efbe86e1fa92a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
