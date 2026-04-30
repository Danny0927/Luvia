import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AccountProvider } from '@/contexts/account';
import { DailyProgressProvider } from '@/contexts/daily-progress';
import { GoalsProvider } from '@/contexts/goals';
import { ThemePreferenceProvider } from '@/contexts/theme-preference';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AccountProvider>
        <ThemePreferenceProvider>
          <GoalsProvider>
            <DailyProgressProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="create-account" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </DailyProgressProvider>
          </GoalsProvider>
        </ThemePreferenceProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}
