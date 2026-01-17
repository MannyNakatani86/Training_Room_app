import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from '../fireBaseConfig'; // This imports the database you initialized

// We define what a "Customer" looks like for TypeScript
export interface CustomerData {
  name: string;
  email: string;
  phoneNumber?: string; // The "?" means it is optional
}

export const saveCustomerData = async (userId: string, data: CustomerData) => {
  try {
    // This creates (or updates) a document in the "customers" collection
    await setDoc(doc(db, "customers", userId), {
      ...data,
      createdAt: serverTimestamp(), // Records exactly when they were created
    });
    console.log("Success: Customer saved to Firestore!");
    return { success: true };
  } catch (error) {
    console.error("Error saving customer:", error);
    return { success: false, error };
  }
};