import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../store';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Fitness Quest' }} />
          <Stack.Screen name="onboarding" options={{ title: 'Your plan' }} />
          <Stack.Screen name="workout" options={{ title: 'Workout' }} />
          <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
          <Stack.Screen name="finish" options={{ title: 'Finish Day', presentation: 'modal' }} />
          <Stack.Screen name="check-in" options={{ title: 'Check-in' }} />
          <Stack.Screen name="progress" options={{ title: 'Progress' }} />
          <Stack.Screen name="safety" options={{ title: 'Safety' }} />
          <Stack.Screen name="account" options={{ title: 'Account & sync' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
