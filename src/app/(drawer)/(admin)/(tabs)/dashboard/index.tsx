import React, { useState, useEffect, useCallback } from "react";
import {
  useColorScheme,
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Ionicons } from "@expo/vector-icons";
import { HStack } from "@/components/hstack";
import PlayerStatistics from "./playerStatistics";
import GameFeed, { GameFeedContent } from "./gameFeed";
import Watermark from "@/components/watermark";
import { getPlayers, getCourses, PlayerApi } from "@/api/admin/dashboard";

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    players: 0,
    courses: 0,
    bestHandicap: "-",
  });
  const [players, setPlayers] = useState<PlayerApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (activeTab !== "overview") {
          setActiveTab("overview");
          return true;
        } else {
          router.replace("/(auth)/login");
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [activeTab])
  );

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [players, courses] = await Promise.all([
        getPlayers(),
        getCourses(),
      ]);

      // Calculate best handicap (lowest value from index or baseline)
      let best = "-";
      if (players.length > 0) {
        const handicaps = players
          .filter(p => !p.isBlocked && (p.totalRounds > 0 || p.handicapIndex !== null))
          .map(p => {
            const val = p.handicapIndex !== null ? p.handicapIndex : (p.calculatedHandicap ?? p.handicap);
            return typeof val === 'string' ? parseFloat(val) : val;
          })
          .filter((h) => h !== null && !isNaN(h) && typeof h === "number");

        if (handicaps.length > 0) {
          const minHandicap = Math.min(...handicaps);
          best = minHandicap.toFixed(1);
        }
      }

      setPlayers(players);

      setStats({
        players: players.length,
        courses: courses.length,
        bestHandicap: best,
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
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}
    >
      <Watermark />

      {/* Header + Tabs */}
      <VStack className="px-4 bg-transparent">
        <VStack className="mb-6">
          <HStack className="items-center">
            <VStack style={{ flex: 1 }}>
              <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Dashboard Overview
              </Text>
              <Text className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Manage your golf league's players, courses, and tournaments.
              </Text>
            </VStack>
            <VStack className="items-end justify-center">
              <Text 
                className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded ${isDark ? "text-gray-400 bg-white/5" : "text-gray-500 bg-gray-100"}`}
              >
                Admin
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Tab Buttons */}
        <HStack
          className="rounded-full p-1 mb-6"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}
        >
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
                  color={active ? "#fff" : isDark ? "#aaa" : "#6b7280"}
                  className="mr-1"
                />
                <Text className={`text-sm font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}>
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
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 120,
            }}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center pt-10">
                <ActivityIndicator size="large" color="#8BC34A" />
                <Text className="mt-2 text-gray-500">Loading metrics...</Text>
              </View>
            ) : (
              <VStack style={{ gap: 16, marginBottom: 16 }}>
                <HStack style={{ gap: 12 }}>
                  <Box
                    className="flex-1 rounded-xl p-5 min-h-[160px]"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                      borderColor: "#8BC34A",
                      borderWidth: 1.5,
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons
                        name="people-outline"
                        size={22}
                        color="#8BC34A"
                      />
                    </Box>
                    <VStack className="flex-1 justify-between">
                      <VStack>
                        <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.players}</Text>
                        <Text className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}>Total Players</Text>
                      </VStack>
                      <Pressable
                        className="py-2 rounded-lg items-center mt-2"
                        onPress={() => setActiveTab("statistics")}
                        style={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          borderColor: "rgba(46, 125, 50, 0.4)",
                          borderWidth: 1.0,
                        }}
                      >
                        <Text className="text-[10px] font-bold text-[#2E7D32]">
                          MEMBERS
                        </Text>
                      </Pressable>
                    </VStack>
                  </Box>

                  <Box
                    className="flex-1 rounded-xl p-5 min-h-[160px]"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                      borderColor: "#8BC34A",
                      borderWidth: 1.5,
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-blue-100 p-2 rounded-full">
                      <Ionicons name="flag-outline" size={22} color="#06B6D4" />
                    </Box>
                    <VStack className="flex-1 justify-between">
                      <VStack>
                        <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.courses}</Text>
                        <Text className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}>Total Courses</Text>
                      </VStack>
                      <Pressable 
                        className="py-2 rounded-lg items-center mt-2"
                        style={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          borderColor: "rgba(2, 136, 209, 0.4)",
                          borderWidth: 1.0,
                        }}
                      >
                        <Text className="text-[10px] font-bold text-[#0288D1]">
                          VENUES
                        </Text>
                      </Pressable>
                    </VStack>
                  </Box>
                </HStack>

                <Box
                  className="rounded-xl p-5 min-h-[160px]"
                  style={{
                    backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                    borderColor: "#8BC34A",
                    borderWidth: 1.5,
                  }}
                >
                  <Box className="absolute top-3 right-3 bg-yellow-100 p-2 rounded-full">
                    <Ionicons
                      name="trending-down-outline"
                      size={22}
                      color="#FBBF24"
                    />
                  </Box>
                  <VStack className="flex-1 justify-between">
                    <VStack>
                      <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.bestHandicap}</Text>
                      <Text className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}>Top Handicaps</Text>
                    </VStack>
                    <Pressable 
                      className="py-2 rounded-lg items-center mt-2"
                      style={{ 
                        backgroundColor: "rgba(254, 252, 232, 0.2)",
                        borderColor: "rgba(176, 137, 0, 0.4)",
                        borderWidth: 1.0,
                      }}
                    >
                      <Text className="text-[10px] font-bold text-[#B08900]">
                        TRACKED
                      </Text>
                    </Pressable>
                  </VStack>
                </Box>

                <Box className="mt-4">
                  <GameFeedContent />
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
