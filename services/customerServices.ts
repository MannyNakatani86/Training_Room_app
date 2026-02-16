import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../fireBaseConfig'; // This imports the database you initialized

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

export const uploadProfileImage = async (userId: string, uri: string) => {
  try {
    // 1. Convert image to a format Firebase can handle (blob)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Create a reference in Storage (e.g., profile_images/user123.jpg)
    const imageRef = ref(storage, `profile_images/${userId}`);

    // 3. Upload the file
    await uploadBytes(imageRef, blob);

    // 4. Get the public URL of that image
    const downloadURL = await getDownloadURL(imageRef);

    // 5. Update the user's document in Firestore with the new URL
    const userDoc = doc(db, "customers", userId);
    await updateDoc(userDoc, { profileImage: downloadURL });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error };
  }
};

export const deleteUserData = async (userId: string) => {
  try {
    // 1. Delete the main customer profile document
    await deleteDoc(doc(db, "customers", userId));

    // 2. Optional: Delete the workouts sub-collection
    // Note: Firestore doesn't delete sub-collections automatically on the client side.
    // We fetch them and delete them manually.
    const workoutsRef = collection(db, "customers", userId, "workouts");
    const snapshot = await getDocs(query(workoutsRef));
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // 3. Delete profile image from Storage if it exists
    const imageRef = ref(storage, `profile_images/${userId}`);
    try {
      await deleteObject(imageRef);
    } catch (e) {
      // Ignore error if no image existed
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user data:", error);
    return { success: false, error };
  }
};