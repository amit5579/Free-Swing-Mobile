import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedRole, token] = await Promise.all([
          AsyncStorage.getItem("role"),
          AsyncStorage.getItem("token")
        ]);

        if (!token || !storedRole) {
          router.replace("/(auth)/login");
          return;
        }

        if (storedRole.toLowerCase() === "admin") {
          router.replace("/(drawer)/(admin)/(tabs)/dashboard");
        } else {
          router.replace("/(drawer)/(user)/(tabs)/dashboard");
        }
      } catch (err) {
        console.log("Error reading auth state:", err);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}


// import { Redirect } from 'expo-router';
// import React from 'react';

// export default function HomeScreen() {
//   return <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />;
// }