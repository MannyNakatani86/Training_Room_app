import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../fireBaseConfig';

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

/*
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
*/

export const updateGlobalLeaderboard = async (userId: string, userName: string, exerciseName: string, weight: number, unit: string) => {
  // 1. Only allow specific exercises to reach the leaderboard
  const ALLOWED_EXERCISES = [
    "Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", 
    "Deadlift", "Clean", "Snatch", "Jerk", "Push Press", "Trap Bar Deadlift"
  ];

  if (!ALLOWED_EXERCISES.includes(exerciseName)) return;

  // 2. Normalize to kg for global comparison
  const weightInKg = unit === 'lbs' ? weight * 0.453592 : weight;
  
  const leaderRef = doc(db, "leaderboards", exerciseName, "rankings", userId);
  
  try {
    // 3. PR Check: Only update if the new weight is heavier than the existing score
    const currentDoc = await getDoc(leaderRef);
    if (currentDoc.exists()) {
      const existingScore = currentDoc.data().score;
      if (weightInKg <= existingScore) {
        console.log("Not a PR. Leaderboard not updated.");
        return; 
      }
    }

    // 4. This automatically creates the exercise document if it doesn't exist!
    await setDoc(leaderRef, {
      userName,
      score: weightInKg,
      userId,
      verified: false, // Default to false until a coach reviews video
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log(`Leaderboard updated for ${exerciseName}`);
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

export const copyWorkoutToToday = async (userId: string, sourceDateStr: string, todayStr: string) => {
  try {
    const sourceRef = doc(db, "customers", userId, "workouts", sourceDateStr);
    const sourceSnap = await getDoc(sourceRef);

    if (sourceSnap.exists()) {
      const exercisesToCopy = sourceSnap.data().exercises || [];
      const todayRef = doc(db, "customers", userId, "workouts", todayStr);
      
      // Overwrite today's session with the copied exercises
      await setDoc(todayRef, {
        exercises: exercisesToCopy,
        date: todayStr,
        isFinished: false,
        isStarted: true // Auto-start the session
      }, { merge: true });
      
      return { success: true };
    }
    return { success: false, error: "No exercises found to copy." };
  } catch (error) {
    return { success: false, error };
  }
};

export const submitVerificationRequest = async (
  userId: string, 
  userName: string, 
  exercise: string, 
  score: number, 
  localVideoUri: string
) => {
  try {
    // 1. Upload Video to Firebase Storage
    const response = await fetch(localVideoUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `verifications/${userId}_${Date.now()}.mp4`);
    await uploadBytes(storageRef, blob);
    const videoUrl = await getDownloadURL(storageRef);

    // 2. Save Request to Firestore for the Company to see
    await addDoc(collection(db, "verificationRequests"), {
      userId,
      userName,
      exercise,
      score,
      videoUrl,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};