import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";

import { AuthProvider } from "@/context/AuthContext";
import { store } from "@/redux/store";


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        text1NumberOfLines={2}
        text2NumberOfLines={3}
        style={{
          borderLeftColor: "#22c55e",
          height: 70,
          width: "92%",
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 17,
          fontWeight: "600",
          color: isDark ? "#ffffff" : "#0f172a",
        }}
        text2Style={{
          fontSize: 14,
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        text1NumberOfLines={2}
        text2NumberOfLines={3}
        style={{
          borderLeftColor: "#ef4444",
          height: 90,
          width: "92%",
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 17,
          fontWeight: "600",
          color: isDark ? "#ffffff" : "#0f172a",
        }}
        text2Style={{
          fontSize: 14,
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      />
    ),
    info: (props: any) => (
      <BaseToast
        {...props}
        text1NumberOfLines={2}
        text2NumberOfLines={3}
        style={{
          borderLeftColor: "#3b82f6",
          height: 90,
          width: "92%",
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 17,
          fontWeight: "600",
          color: isDark ? "#ffffff" : "#0f172a",
        }}
        text2Style={{
          fontSize: 14,
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      />
    ),
  };

  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast config={toastConfig} />
          </ThemeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
