import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../fireBaseConfig';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const segmentArray = segments as string[];
    const inAuthGroup = segmentArray.includes('(auth)');
    const isSignupPage = segmentArray.includes('signup');
    const isVerifyPage = segmentArray.includes('verify-email');

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // IF USER EXISTS
      if (!user.emailVerified) {
        // If they are unverified, we only allow them on 'signup' (to change details) or 'verify-email'
        if (!isSignupPage && !isVerifyPage) {
          router.replace('/(auth)/verify-email');
        }
      } else {
        // If they ARE verified and in the auth group, send them home
        if (inAuthGroup) {
          router.replace('/(main)/(tabs)');
        }
      }
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#c62828" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
    </Stack>
  );
}