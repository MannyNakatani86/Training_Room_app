import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from '../fireBaseConfig';

export const signUp = async (email: string, pass: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Send verification email immediately after creation
    await sendEmailVerification(userCredential.user);
    
    return { user: userCredential.user, success: true };
  } catch (error: any) {
    return { error: error.message, success: false };
  }
};

// Sign into existing account
export const logIn = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { user: userCredential.user, success: true };
  } catch (error: any) {
    return { error: error.message, success: false };
  }
};

// Resetting Password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};