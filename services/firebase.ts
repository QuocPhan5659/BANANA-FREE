import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

// These should be set in .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Only initialize if we have the API key to prevent crashing
const isFirebaseConfigured = !!firebaseConfig.apiKey;

if (!isFirebaseConfigured) {
  console.warn("Firebase API Key is missing. Authentication will not work until configured in Settings.");
}

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase is not configured. Please add your Firebase API key in the settings.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  if (!auth) throw new Error("Firebase not configured");
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(result.user, { displayName: name });
  return result.user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase not configured");
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export type AccountTier = 'Free' | 'Pro' | 'Plus';

export const getAccountTier = (user: User | null): AccountTier => {
  if (!user) return 'Free';
  
  // Simple logic to determine tier based on email for demonstration
  // In a real app, this would come from a database or subscription service
  const email = user.email || '';
  if (email.endsWith('@google.com') || email.includes('plus')) return 'Plus';
  if (email.includes('pro') || email === 'arc.quocphan9999@gmail.com') return 'Pro';
  
  return 'Free';
};
