import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from '../fireBaseConfig';

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string[];
  groupTitle?: string;
  repUnits?: string[];
  supersetId?: string;
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

export const updateGlobalLeaderboard = async (userId: string, userName: string, exerciseName: string, weight: number, unit: string) => {
  // Normalize to kg for global comparison
  const weightInKg = unit === 'lbs' ? weight * 0.453592 : weight;
  
  const leaderRef = doc(db, "leaderboards", exerciseName, "rankings", userId);
  try {
    await setDoc(leaderRef, {
      userName,
      score: weightInKg,
      userId,
      updatedAt: new Date()
    }, { merge: true });
  } catch (e) {
    console.error("Error updating leaderboard", e);
  }
};

export const deleteExerciseFromAllHistory = async (userId: string, exerciseName: string) => {
  try {
    const workoutsRef = collection(db, "customers", userId, "workouts");
    const snapshot = await getDocs(query(workoutsRef));
    const deletePromises = snapshot.docs.map(async (workoutDoc) => {
      const data = workoutDoc.data();
      if (data.exercises) {
        const updated = data.exercises.filter((ex: any) => ex.name !== exerciseName);
        await updateDoc(workoutDoc.ref, { exercises: updated });
      }
    });
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};