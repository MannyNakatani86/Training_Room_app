import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from '../fireBaseConfig';

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string[];
  groupTitle?: string; // Add this field
  loggedWeights?: string[];
  memo?: string;
  completedSetsCount?: number;
}

export const addExerciseToDate = async (userId: string, dateString: string, exercise: Exercise) => {
  const docRef = doc(db, "customers", userId, "workouts", dateString);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { exercises: arrayUnion(exercise) });
    } else {
      await setDoc(docRef, { exercises: [exercise], date: dateString });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const deleteExerciseFromDate = async (userId: string, dateString: string, exerciseId: string) => {
  const docRef = doc(db, "customers", userId, "workouts", dateString);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentExercises: Exercise[] = docSnap.data().exercises || [];
      const updatedExercises = currentExercises.filter(ex => ex.id !== exerciseId);
      await updateDoc(docRef, { exercises: updatedExercises });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateExerciseInDate = async (userId: string, dateString: string, updatedEx: Exercise) => {
  const docRef = doc(db, "customers", userId, "workouts", dateString);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentExercises: Exercise[] = docSnap.data().exercises || [];
      const updatedList = currentExercises.map(ex => ex.id === updatedEx.id ? updatedEx : ex);
      await updateDoc(docRef, { exercises: updatedList });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};