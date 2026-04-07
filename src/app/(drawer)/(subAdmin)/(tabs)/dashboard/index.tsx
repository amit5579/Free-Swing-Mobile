import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubAdminDashboard() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Sub-Admin Dashboard</Text>
    </SafeAreaView>
  );
}
