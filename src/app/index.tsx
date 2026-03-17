import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function HomeScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("role");

        setRole(storedRole);
      } catch (err) {
        console.log("Error reading role:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, []);

  // Show loader while checking storage
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect after role is loaded
  return role === "admin" ? (
    <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />
  ) : (
    <Redirect href="/(drawer)/(user)/(tabs)/dashboard" />
  );
}


// import { Redirect } from 'expo-router';
// import React from 'react';

// export default function HomeScreen() {
//   return <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />;
// }