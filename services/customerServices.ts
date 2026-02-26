import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from '../fireBaseConfig'; // This imports the database you initialized

// We define what a "Customer" looks like for TypeScript
export interface CustomerData {
  name: string;
  email: string;
  phoneNumber?: string; // The "?" means it is optional
}

export const saveCustomerData = async (userId: string, data: any) => {
  try {
    await setDoc(doc(db, "customers", userId), {
      ...data,
      username: data.username.toLowerCase(),
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const uploadProfileImage = async (userId: string, uri: string) => {
  try {
    // 1. Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Create Storage Reference
    const imageRef = ref(storage, `profile_images/${userId}`);

    // 3. Upload
    await uploadBytes(imageRef, blob);

    // 4. Get URL and update Firestore
    const downloadURL = await getDownloadURL(imageRef);
    const userDoc = doc(db, "customers", userId);
    await updateDoc(userDoc, { profileImage: downloadURL });

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error };
  }
};

export const deleteUserData = async (userId: string) => {
  try {
    // 1. Delete Workouts Sub-collection
    const workoutsRef = collection(db, "customers", userId, "workouts");
    const workoutSnaps = await getDocs(workoutsRef);
    const workoutDeletePromises = workoutSnaps.docs.map(d => deleteDoc(d.ref));
    await Promise.all(workoutDeletePromises);

    // 2. Delete Health/Metrics Sub-collection
    const metricsRef = collection(db, "customers", userId, "health");
    const metricSnaps = await getDocs(metricsRef);
    const metricDeletePromises = metricSnaps.docs.map(d => deleteDoc(d.ref));
    await Promise.all(metricDeletePromises);

    // 3. Delete Profile Image from Storage (if exists)
    const imageRef = ref(storage, `profile_images/${userId}`);
    try {
      await deleteObject(imageRef);
    } catch (e) {
      // Ignore error if image doesn't exist
    }

    // 4. Delete Main Profile Document
    await deleteDoc(doc(db, "customers", userId));

    return { success: true };
  } catch (error) {
    console.error("Error cleaning up data:", error);
    return { success: false, error };
  }
};

export const isUsernameUnique = async (username: string) => {
  if (!username) return false;
  // Firestore queries are case-sensitive by default, but we store them lowercase
  const customersRef = collection(db, "customers");
  const q = query(customersRef, where("username", "==", username.toLowerCase().trim()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty; // True if no one has this username
};

export const updateUsername = async (userId: string, newUsername: string) => {
  try {
    const isUnique = await isUsernameUnique(newUsername);
    if (!isUnique) return { success: false, error: "Username already taken" };

    const userRef = doc(db, "customers", userId);
    await updateDoc(userRef, {
      username: newUsername.toLowerCase().trim()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

