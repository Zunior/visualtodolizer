import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../global.css";

import { SciFiTheme } from '@/constants/scifiTheme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Custom sci-fi navigation theme
const SciFiNavigationTheme = {
  dark: true,
  colors: {
    primary: SciFiTheme.colors.neonCyan,
    background: SciFiTheme.colors.bgPrimary,
    card: SciFiTheme.colors.bgSecondary,
    text: SciFiTheme.colors.textPrimary,
    border: SciFiTheme.colors.borderDim,
    notification: SciFiTheme.colors.neonCyan,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
    },
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={SciFiNavigationTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="folder/[id]" options={{ title: 'Folder', headerBackVisible: true }} />
          <Stack.Screen name="editor/[id]" options={{ title: 'Editor', headerBackVisible: true }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Node' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
