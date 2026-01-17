import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../fireBaseConfig';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const router = useRouter();
  const segments = useSegments(); // This tells us which folder the user is currently in

  useEffect(() => {
    // 1. Listen for Auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // Cleanup the listener when app closes
  }, []);

  useEffect(() => {
    if (initializing) return; // Wait until Firebase checks the user status

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!user && !inAuthGroup) {
      // 2. If NO user and NOT in Login, force them to Login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // 3. If YES user and still in Login, force them to Home
      router.replace('/');
    }
  }, [user, initializing]);

  if (initializing) {
    // Show a loading spinner while checking if the user is logged in
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}