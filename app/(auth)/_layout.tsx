import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This ensures the Login screen doesn't have a giant white bar at the top */}
      <Stack.Screen name="login" />
    </Stack>
  );
}