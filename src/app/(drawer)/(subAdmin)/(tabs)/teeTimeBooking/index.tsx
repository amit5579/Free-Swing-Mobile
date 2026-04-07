import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubAdminTeeTimeBooking() {
  const isDark = useColorScheme() === "dark";
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Tee Time Booking</Text>
    </SafeAreaView>
  );
}
