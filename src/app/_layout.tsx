import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider } from "@/context/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import NoConnectionScreen from "@/components/NoConnectionScreen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  const { isConnected } = useNetworkStatus();

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          {isConnected === false ? (
            <NoConnectionScreen />
          ) : (
            <Stack screenOptions={{ headerShown: false }} />
          )}
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}