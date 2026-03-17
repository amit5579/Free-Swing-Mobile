import React, { useState } from "react";
import { useColorScheme, Pressable, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Ionicons } from "@expo/vector-icons";
import { HStack } from "@/components/hstack";
import PlayerStatistics from "./playerStatistics";
import Watermark from "@/components/watermark";

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "statistics", label: "Player Statistics", icon: "people-outline" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <Watermark />

      {/* Header + Tabs */}
      <VStack className="px-4 bg-transparent">
        <VStack className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Dashboard Overview</Text>
          <Text className="text-lg font-medium text-gray-700">
            Manage your golf league's players, courses, and tournaments.
          </Text>
        </VStack>

        {/* Tab Buttons */}
        <HStack className="rounded-full p-1 mb-6 bg-gray-200">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 px-4 py-2 rounded-full flex-row items-center justify-center"
                style={active ? { backgroundColor: "#8BC34A" } : {}}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={active ? "#fff" : "#6b7280"}
                  className="mr-1"
                />
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-gray-600"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "overview" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          >
            {/* Overview cards */}
            <VStack className="space-y-4 mb-3">
              <HStack className="space-x-3">
                <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 min-h-[140px]">
                  <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                    <Ionicons name="people-outline" size={22} color="#FBBF24" />
                  </Box>
                  <VStack className="space-y-2">
                    <Text className="text-3xl font-bold text-gray-900">14</Text>
                    <Text className="text-sm font-bold text-gray-900">Total Players</Text>
                  </VStack>
                </Box>

                <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 min-h-[140px]">
                  <Box className="absolute top-3 right-3 bg-blue-100 p-2 rounded-full">
                    <Ionicons name="flag" size={22} color="#06B6D4" />
                  </Box>
                  <VStack className="space-y-2">
                    <Text className="text-3xl font-bold text-gray-900">9</Text>
                    <Text className="text-sm font-bold text-gray-900">Total Courses</Text>
                  </VStack>
                </Box>
              </HStack>

              <Box className="bg-white rounded-xl border border-gray-200 p-5 min-h-[140px]">
                <Box className="absolute top-3 right-3 bg-yellow-100 p-2 rounded-full">
                  <Ionicons name="trophy-outline" size={22} color="#FBBF24" />
                </Box>
                <VStack className="space-y-2">
                  <Text className="text-3xl font-bold text-gray-900">Stars</Text>
                  <Text className="text-sm font-bold text-gray-900">View Report</Text>
                </VStack>
              </Box>
            </VStack>
          </ScrollView>
        )}

        {activeTab === "statistics" && (
          <PlayerStatistics />
        )}
      </View>
    </SafeAreaView>
  );
}