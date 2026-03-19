import React, { useState, useEffect } from "react";
import { useColorScheme, Pressable, Text, View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Ionicons } from "@expo/vector-icons";
import { HStack } from "@/components/hstack";
import PlayerStatistics from "./playerStatistics";
import Watermark from "@/components/watermark";
import { getPlayers, getCourses, PlayerApi } from "@/api/adminAPI/dashboard";

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ players: 0, courses: 0, bestHandicap: '-' });
  const [players, setPlayers] = useState<PlayerApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [players, courses] = await Promise.all([
        getPlayers(),
        getCourses(),
      ]);

      // Calculate best handicap (lowest value from index or baseline)
      let best = '-';
      if (players.length > 0) {
        const handicaps = players
          .map(p => {
            const val = p.handicapIndex !== null ? p.handicapIndex : (p.calculatedHandicap ?? p.handicap);
            return typeof val === 'string' ? parseFloat(val) : val;
          })
          .filter(h => h !== null && !isNaN(h) && typeof h === 'number');

        if (handicaps.length > 0) {
          const minHandicap = Math.min(...handicaps);
          best = minHandicap.toFixed(1);
        }
      }

      setPlayers(players);

      setStats({
        players: players.length,
        courses: courses.length,
        bestHandicap: best
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "statistics", label: "Player Statistics", icon: "people-outline" },
  ];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center pt-10">
                <ActivityIndicator size="large" color="#8BC34A" />
                <Text className="mt-2 text-gray-500">Loading metrics...</Text>
              </View>
            ) : (
              <VStack style={{ gap: 16, marginBottom: 16 }}>
                <HStack style={{ gap: 12 }}>
                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 min-h-[160px]">
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="people-outline" size={22} color="#8BC34A" />
                    </Box>
                    <VStack className="flex-1 justify-between">
                      <VStack>
                        <Text className="text-3xl font-bold text-gray-900">{stats.players}</Text>
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Players</Text>
                      </VStack>
                      <Pressable
                        className="bg-gray-100 py-2 rounded-lg items-center mt-2"
                        onPress={() => setActiveTab('statistics')}
                      >
                        <Text className="text-[10px] font-bold text-[#2E7D32]">MEMBERS</Text>
                      </Pressable>
                    </VStack>
                  </Box>

                  <Box className="flex-1 bg-white rounded-xl border border-gray-200 p-5 min-h-[160px]">
                    <Box className="absolute top-3 right-3 bg-blue-100 p-2 rounded-full">
                      <Ionicons name="flag-outline" size={22} color="#06B6D4" />
                    </Box>
                    <VStack className="flex-1 justify-between">
                      <VStack>
                        <Text className="text-3xl font-bold text-gray-900">{stats.courses}</Text>
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Courses</Text>
                      </VStack>
                      <Pressable className="bg-gray-100 py-2 rounded-lg items-center mt-2">
                        <Text className="text-[10px] font-bold text-[#0288D1]">VENUES</Text>
                      </Pressable>
                    </VStack>
                  </Box>
                </HStack>

                <Box className="bg-white rounded-xl border border-gray-200 p-5 min-h-[160px]">
                  <Box className="absolute top-3 right-3 bg-yellow-100 p-2 rounded-full">
                    <Ionicons name="trending-down-outline" size={22} color="#FBBF24" />
                  </Box>
                  <VStack className="flex-1 justify-between">
                    <VStack>
                      <Text className="text-3xl font-bold text-gray-900">{stats.bestHandicap}</Text>
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Handicaps</Text>
                    </VStack>
                    <Pressable className="bg-yellow-50 py-2 rounded-lg items-center mt-2 border border-yellow-100">
                      <Text className="text-[10px] font-bold text-[#B08900]">TRACKED</Text>
                    </Pressable>
                  </VStack>
                </Box>
              </VStack>
            )}
          </ScrollView>
        )}

        {activeTab === "statistics" && (
          <PlayerStatistics players={players} loading={loading} />
        )}
      </View>
    </SafeAreaView>
  );
}