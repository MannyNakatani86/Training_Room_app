import {
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from '../fireBaseConfig';

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string[];
  groupTitle?: string;
  loggedWeights?: string[];
  memo?: string;
  completedSetsCount?: number;
}

// 1. Add a new exercise to a specific date
export const addExerciseToDate = async (userId: string, dateString: string, exercise: Exercise) => {
  const docRef = doc(db, "customers", userId, "workouts", dateString);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { exercises: arrayUnion(exercise) });
    } else {
      await setDoc(docRef, { exercises: [exercise], date: dateString, isFinished: false });
    }
    return { success: true };
  } catch (error) {
    console.error("Error adding exercise:", error);
    return { success: false, error };
  }
};

// 2. Delete an exercise
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

// 3. Update an existing exercise
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