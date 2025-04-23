/**
 * Firebase configuration and initialization module
 */

import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { Auth, getAuth } from "firebase/auth";
import { Functions, getFunctions } from "firebase/functions";

// Create a type-safe configuration object from environment variables
const createFirebaseConfig: () => FirebaseOptions = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  };
};

// Get configuration and log warnings for missing values
const firebaseConfig = createFirebaseConfig();

// Verify that essential configuration is present
const missingKeys = Object.entries(firebaseConfig)
  .filter(
    ([key, value]) =>
      !value && ["apiKey", "authDomain", "projectId"].includes(key)
  )
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    `Missing essential Firebase configuration: ${missingKeys.join(
      ", "
    )}. Some features may not work correctly.`
  );
}

// Initialize Firebase services
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;

try {
  // Initialize Firebase application
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services
  db = getFirestore(app);
  auth = getAuth(app);
  functions = getFunctions(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Create fallback exports to prevent runtime errors
  // These will be non-functional but won't crash the app
  const mockApp = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
  functions = {} as Functions;
}

// Export initialized services for use in the application
export { db, auth, functions };
