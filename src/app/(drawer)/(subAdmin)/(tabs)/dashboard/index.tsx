import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  BackHandler,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Ionicons } from "@expo/vector-icons";
import { HStack } from "@/components/hstack";
import { TextInput } from "react-native";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import {
  getSubAdminPlayers,
  getSubAdminCourses,
  getUpdates,
} from "@/api/modules/subAdmin/dashboard.api";
import GameFeed, {
  GameFeedContent,
} from "@/app/(drawer)/(admin)/(tabs)/dashboard/gameFeed";

export default function SubAdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    players: 0,
    courses: 0,
    updates: 0,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats(true);

      const onBackPress = () => {
        router.replace("/(auth)/login");
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, []),
  );

  const fetchStats = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const [players, courses, updates] = await Promise.all([
        getSubAdminPlayers(),
        getSubAdminCourses(),
        getUpdates(),
      ]);
      setStats({
        players: players.length,
        courses: courses.length,
        updates: updates.length,
      });
    } catch (error) {
      console.error("SubAdmin dashboard stats error:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}
    >
      <Watermark />

      <VStack className="px-4 bg-transparent">
        <VStack className="mb-2">
          <HStack className="items-center">
            <VStack style={{ flex: 1 }}>
              <Text
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Sub Admin Dashboard
              </Text>
              <Text
                className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Manage your players, courses &amp; broadcasts.
              </Text>
            </VStack>
            <VStack className="items-end justify-center">
              <Text
                className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded-full ${
                  isDark
                    ? "text-black bg-yellow-400"
                    : "text-black bg-yellow-300"
                }`}
              >
                Sub Admin
              </Text>
            </VStack>
          </HStack>
        </VStack>

        <Box
          className="mb-4 flex-row items-center px-4 rounded-xl border"
          style={{
            height: 44,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.9)",
            borderColor: isDark
              ? "rgba(139,195,74,0.3)"
              : "rgba(229,231,235,1)",
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
            placeholder="Search game feed..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? "#6B7280" : "#9CA3AF"}
              />
            </TouchableOpacity>
          )}
        </Box>
      </VStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8BC34A"]}
            tintColor="#8BC34A"
          />
        }
      >
        {loading ? (
          <HStack className="space-x-2 mb-4" style={{ gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                className="flex-1 rounded-xl p-3"
                style={{
                  backgroundColor: isDark
                    ? "rgba(22,22,24,0.4)"
                    : "rgba(255,255,255,0.35)",
                  minHeight: 140,
                  borderColor: "rgba(139,195,74,0.3)",
                  borderWidth: 1,
                }}
              >
                <Skeleton
                  isDark={isDark}
                  height={28}
                  width={40}
                  style={{ marginBottom: 12 }}
                />
                <Skeleton
                  isDark={isDark}
                  height={10}
                  width="80%"
                  style={{ marginBottom: 10 }}
                />
                <Skeleton
                  isDark={isDark}
                  height={16}
                  width="60%"
                  borderRadius={8}
                />
              </Box>
            ))}
          </HStack>
        ) : (
          <HStack style={{ gap: 8, marginBottom: 16 }}>
            <Box
              className="flex-1 rounded-xl p-3 min-h-[140px]"
              style={{
                backgroundColor: isDark
                  ? "rgba(22,22,24,0.4)"
                  : "rgba(255,255,255,0.35)",
                borderColor: "#8BC34A",
                borderWidth: 1.5,
              }}
            >
              <VStack className="flex-1 justify-between">
                <VStack className="items-center mt-1">
                  <Box className="bg-green-100 p-1.5 rounded-full mb-2">
                    <Ionicons name="people-outline" size={16} color="#8BC34A" />
                  </Box>
                  <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {stats.players}
                  </Text>
                  <Text
                    style={{ textAlign: "center" }}
                    className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                  >
                    My Players
                  </Text>
                </VStack>
                <Pressable
                  className="py-1.5 rounded-lg items-center mt-2"
                  // onPress={() => router.push("/(drawer)/(subAdmin)/(tabs)/players/index" as any)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(46,125,50,0.4)",
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[9px] font-bold text-[#2E7D32]">
                    ASSIGNED
                  </Text>
                </Pressable>
              </VStack>
            </Box>

            <Box
              className="flex-1 rounded-xl p-3 min-h-[140px]"
              style={{
                backgroundColor: isDark
                  ? "rgba(22,22,24,0.4)"
                  : "rgba(255,255,255,0.35)",
                borderColor: "#8BC34A",
                borderWidth: 1.5,
              }}
            >
              <VStack className="flex-1 justify-between">
                <VStack className="items-center mt-1">
                  <Box className="bg-blue-100 p-1.5 rounded-full mb-2">
                    <Ionicons name="flag-outline" size={16} color="#06B6D4" />
                  </Box>
                  <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {stats.courses}
                  </Text>
                  <Text
                    style={{ textAlign: "center" }}
                    className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                  >
                    Assigned Courses
                  </Text>
                </VStack>
                <Pressable
                  className="py-1.5 rounded-lg items-center mt-2"
                  // onPress={() => router.push("/(drawer)/(subAdmin)/(tabs)/course/index" as any)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(2,136,209,0.4)",
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[9px] font-bold text-[#0288D1]">
                    MANAGED
                  </Text>
                </Pressable>
              </VStack>
            </Box>

            <Box
              className="flex-1 rounded-xl p-3 min-h-[140px]"
              style={{
                backgroundColor: isDark
                  ? "rgba(22,22,24,0.4)"
                  : "rgba(255,255,255,0.35)",
                borderColor: "#8BC34A",
                borderWidth: 1.5,
              }}
            >
              <VStack className="flex-1 justify-between">
                <VStack className="items-center mt-1">
                  <Box className="bg-yellow-100 p-1.5 rounded-full mb-2">
                    <Ionicons
                      name="megaphone-outline"
                      size={16}
                      color="#FBBF24"
                    />
                  </Box>
                  {/* <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {stats.updates}
                  </Text> */}
                  <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Ready
                  </Text>
                  <Text
                    style={{ textAlign: "center" }}
                    className={`text-[9px] font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase tracking-wider`}
                  >
                    Update Center
                  </Text>
                </VStack>
                <Pressable
                  className="py-1.5 rounded-lg items-center mt-2"
                  style={{
                    backgroundColor: "rgba(254,252,232,0.2)",
                    borderColor: "rgba(176,137,0,0.4)",
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-[9px] font-bold text-[#B08900]">
                    BROADCASTS
                  </Text>
                </Pressable>
              </VStack>
            </Box>
          </HStack>
        )}

        <Box className="mt-2">
          <GameFeedContent searchQuery={searchQuery} />
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
