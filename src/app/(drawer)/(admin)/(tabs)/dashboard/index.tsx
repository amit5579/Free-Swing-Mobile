import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Ionicons } from "@expo/vector-icons";
import { HStack } from "@/components/hstack";
import { TextInput } from "react-native";
import PlayerStatistics from "./playerStatistics";
import GameFeed, { GameFeedContent } from "./gameFeed";
import Watermark from "@/components/watermark";
import { getPlayers, getCourses, PlayerApi } from "@/api/admin/dashboard";
import { Skeleton } from "@/components/Skeleton";

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  const [searchQuery, setSearchQuery] = useState("");

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 60,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          if (activeTab === "overview") setActiveTab("statistics");
        } else if (gestureState.dx > 40) {
          if (activeTab === "statistics") setActiveTab("overview");
        }
      },
    })
  ).current;

  useFocusEffect(
    useCallback(() => {
      fetchStats();

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
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}
    >
      <Watermark />

      <VStack className="px-4 bg-transparent">
        <VStack className="mb-0">
          <HStack className="items-center">
            <VStack style={{ flex: 1 }}>
              <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Dashboard
              </Text>
              <Text className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Manage your golf league's players, courses, and tournaments.
              </Text>
            </VStack>
            <VStack className="items-end justify-center">
              <Text
                className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded-full ${isDark
                  ? "text-black bg-yellow-400"
                  : "text-black bg-yellow-300"
                  }`}
              >
                Admin
              </Text>
            </VStack>
          </HStack>
        </VStack>

        <HStack
          className="rounded-full p-1 mb-4"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                }}
                className="flex-1 px-4 py-2.5 rounded-full flex-row items-center justify-center"
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
        <Box
          className="mb-6 flex-row items-center px-4 rounded-xl border"
          style={{
            height: 44,
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
            borderColor: isDark ? "rgba(139,195,74,0.3)" : "rgba(229,231,235,1)",
          }}
        >
          <Ionicons name="search-outline" size={18} color="#8BC34A" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              color: isDark ? "#fff" : "#111",
              fontSize: 14,
            }}
            placeholder={activeTab === "overview" ? "Search games..." : "Search players..."}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />
            </TouchableOpacity>
          )}
        </Box>
      </VStack>

      <View style={{ flex: 1 }} {...swipePanResponder.panHandlers}>
        {activeTab === "overview" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 120,
            }}
          >
            {loading ? (
              <VStack className="space-y-4 pt-4">
                <HStack className="space-x-2 mb-3">
                  <Box className="flex-1 rounded-xl p-3 mr-1" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)", minHeight: 140, borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                    <Skeleton isDark={isDark} height={28} width={40} style={{ marginBottom: 12 }} />
                    <Skeleton isDark={isDark} height={10} width="80%" style={{ marginBottom: 10 }} />
                    <Skeleton isDark={isDark} height={16} width="60%" borderRadius={8} />
                  </Box>
                  <Box className="flex-1 rounded-xl p-3 mx-1" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)", minHeight: 140, borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                    <Skeleton isDark={isDark} height={28} width={40} style={{ marginBottom: 12 }} />
                    <Skeleton isDark={isDark} height={10} width="80%" style={{ marginBottom: 10 }} />
                    <Skeleton isDark={isDark} height={16} width="60%" borderRadius={8} />
                  </Box>
                  <Box className="flex-1 rounded-xl p-3 ml-1" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)", minHeight: 140, borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                    <Skeleton isDark={isDark} height={28} width={40} style={{ marginBottom: 12 }} />
                    <Skeleton isDark={isDark} height={10} width="80%" style={{ marginBottom: 10 }} />
                    <Skeleton isDark={isDark} height={16} width="60%" borderRadius={8} />
                  </Box>
                </HStack>
              </VStack>
            ) : (
              <VStack style={{ gap: 16, marginBottom: 16 }}>
                <HStack style={{ gap: 8 }}>
                  <Box
                    className="flex-1 rounded-xl p-3 min-h-[140px]"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                      borderColor: "#8BC34A",
                      borderWidth: 1.5,
                    }}
                  >
                    <VStack className="flex-1 justify-between">
                      <VStack className="items-center mt-1">
                        <Box className="bg-green-100 p-1.5 rounded-full mb-2">
                          <Ionicons
                            name="people-outline"
                            size={16}
                            color="#8BC34A"
                          />
                        </Box>
                        <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.players}</Text>
                        <Text
                          style={{ textAlign: "center" }}
                          className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                        >
                          Players
                        </Text>
                      </VStack>
                      <Pressable
                        className="py-1.5 rounded-lg items-center mt-2"
                        onPress={() => {
                          router.push("/allMembers");
                        }}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          borderColor: "rgba(46, 125, 50, 0.4)",
                          borderWidth: 1.0,
                        }}
                      >
                        <Text className="text-[9px] font-bold text-[#2E7D32]">
                          MEMBERS
                        </Text>
                      </Pressable>
                    </VStack>
                  </Box>

                  <Box
                    className="flex-1 rounded-xl p-3 min-h-[140px]"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                      borderColor: "#8BC34A",
                      borderWidth: 1.5,
                    }}
                  >
                    <VStack className="flex-1 justify-between">
                      <VStack className="items-center mt-1">
                        <Box className="bg-blue-100 p-1.5 rounded-full mb-2">
                          <Ionicons name="flag-outline" size={16} color="#06B6D4" />
                        </Box>
                        <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.courses}</Text>
                        <Text
                          style={{ textAlign: "center" }}
                          className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                        >
                          Courses
                        </Text>
                      </VStack>
                      <Pressable
                        className="py-1.5 rounded-lg items-center mt-2"
                        onPress={() => {
                          router.push("/courses");
                        }}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          borderColor: "rgba(2, 136, 209, 0.4)",
                          borderWidth: 1.0,
                        }}
                      >
                        <Text className="text-[9px] font-bold text-[#0288D1]">
                          VENUES
                        </Text>
                      </Pressable>
                    </VStack>
                  </Box>

                  <Box
                    className="flex-1 rounded-xl p-3 min-h-[140px]"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                      borderColor: "#8BC34A",
                      borderWidth: 1.5,
                    }}
                  >
                    <VStack className="flex-1 justify-between">
                      <VStack className="items-center mt-1">
                        <Box className="bg-yellow-100 p-1.5 rounded-full mb-2">
                          <Ionicons
                            name="trending-down-outline"
                            size={16}
                            color="#FBBF24"
                          />
                        </Box>
                        <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stats.bestHandicap}</Text>
                        <Text
                          style={{ textAlign: "center" }}
                          className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                        >
                          Top HCP
                        </Text>
                      </VStack>
                      <Pressable
                        className="py-1.5 rounded-lg items-center mt-2"
                        style={{
                          backgroundColor: "rgba(254, 252, 232, 0.2)",
                          borderColor: "rgba(176, 137, 0, 0.4)",
                          borderWidth: 1.0,
                        }}
                      >
                        <Text className="text-[9px] font-bold text-[#B08900]">
                          TRACKED
                        </Text>
                      </Pressable>
                    </VStack>
                  </Box>
                </HStack>
              </VStack>
            )}

            <Box className="mt-4">
              <GameFeedContent searchQuery={searchQuery} />
            </Box>
          </ScrollView>
        )}

        {activeTab === "statistics" && (
          <PlayerStatistics players={players} loading={loading} searchQuery={searchQuery} />
        )}
      </View>
    </SafeAreaView>
  );
}
