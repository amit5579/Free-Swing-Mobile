import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Text,
  View,
} from "react-native";
import { ThemedView } from "@/components/themed-view";

import { HistoryTab } from "./tabs/HistoryTab";
import { InProgressTab } from "./tabs/InProgressTab";
import { OverviewTab, type Scorecard } from "./tabs/gameFeed";
import { getFeedApi, likeFeedApi } from "@/api/dashboard";
import { getScoreStats, ScoreStats } from "@/api/dashboard";
import { getUserProfile, UserProfile } from "@/api/dashboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import { useRouter } from "expo-router";


const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 3 * CARD_MARGIN - 32) / 2;

export default function DashboardScreen() {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [stats, setStats] = useState<ScoreStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const tabs = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "progress", label: "In Progress", icon: "hourglass-outline" },
    { key: "history", label: "Game History", icon: "time-outline" },
  ];

  useEffect(() => {
    fetchFeed();
    fetchStats();
    fetchProfile(); // 👈 ADD THIS
  }, []);

  const fetchStats = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) return;

      const data = await getScoreStats(Number(userId));
      setStats(data);
    } catch (error) {
      console.log("Stats error:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) return;

      const data = await getUserProfile(Number(userId));
      if (data.profilePictureUrl != null || data.username != null || data.handicap)

        setProfile(data);
    } catch (error) {
      console.log("Profile error:", error);
    }
  };

  const fetchFeed = async () => {
    try {
      const data = await getFeedApi();
      if (data != null) {
        // Map the FeedItem array to the Scorecard array that OverviewTab expects
        const mappedCards: Scorecard[] = data.map((item: any) => ({
          id: item.roundRefId?.toString() || Math.random().toString(),
          playerName: item.playerName || "Unknown",
          date: item.date || "",
          course: item.courseName,
          tee: item.teeBoxName,
          holes: item.holesPlayed || 0,
          grossScore: item.grossScore || 0,
          grossDiff: item.scoreToPar || 0,
          net: item.netScore || 0,
          points: item.stablefordPoints || 0,
          par: item.totalPar || 0,
          likes: item.likeCount || 0,
          isLiked: item.isLikedByMe || false,
          isTournament: !!item.isTournament,
          isAuthenticated: item.isAuthenticated || false,
          authenticatedBy: item.authenticatedBy || null,
          profileImage: item.playerAvatar,
        }));
        setCards(mappedCards);
      } else {
        console.log("No Feed data available.");
      }
      // console.log("FEED DATA:", data);
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            }
            : c
        )
      );

      await likeFeedApi(id);

      // OPTIONAL: sync with backend
      // fetchFeed();

    } catch (error) {
      console.error("Like toggle error:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f2f2f2" }}>
      <Watermark />

      {/* Fixed header + tabs */}
      <View
        style={{
          padding: 16,
          backgroundColor: isDark ? "#161618" : "#f2f2f2",
          zIndex: 10,
        }}
      >
        {loading ? (
          // ✅ HEADER SKELETON
          <VStack className="mb-4 space-y-3">
            {/* Welcome text skeleton */}
            <Skeleton isDark={isDark} height={28} width="60%" />
            <Skeleton isDark={isDark} height={18} width="80%" />

            {/* Tabs skeleton */}
            <HStack
              className="rounded-full p-2 mt-2"
              style={{
                backgroundColor: isDark ? "#1F1F1F" : "#E5E7EB",
              }}
            >
              <Skeleton isDark={isDark} height={32} width="30%" borderRadius={20} style={{ marginRight: 8 }} />
              <Skeleton isDark={isDark} height={32} width="30%" borderRadius={20} style={{ marginRight: 8 }} />
              <Skeleton isDark={isDark} height={32} width="30%" borderRadius={20} />
            </HStack>
          </VStack>
        ) : (
          // ✅ ORIGINAL HEADER
          <>
            <VStack className="mb-4">
              <Text
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Welcome back{profile?.username ? ", " : ""}
                {profile?.username && (
                  <Text style={{ color: "#8BC34A" }}>{profile.username}</Text>
                )}
                !
              </Text>
              <Text
                className={`text-lg font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Track your progress and manage your games
              </Text>
            </VStack>

            <HStack
              className="rounded-full p-1 justify-between"
              style={{
                backgroundColor: isDark ? "#1F1F1F" : "#E5E7EB",
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? "#FFFFFF" : "transparent",
              }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className="px-4 py-2 rounded-full flex-row items-center justify-center"
                    style={{
                      backgroundColor: active ? "#8BC34A" : "transparent",
                    }}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={16}
                      color={active ? "#fff" : isDark ? "#D1D5DB" : "#6B7280"}
                    />
                    <Text
                      className="text-sm font-medium ml-1"
                      style={{ color: active ? "#fff" : isDark ? "#D1D5DB" : "#6B7280" }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {loading ? (
          <VStack className="space-y-4">
            <HStack className="space-x-3 mb-3">
              <Box className="flex-1 rounded-xl p-5 mr-2" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                <Skeleton isDark={isDark} height={36} width={50} style={{ marginBottom: 12 }} />
                <Skeleton isDark={isDark} height={14} width="80%" style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={20} width="60%" borderRadius={10} />
              </Box>
              <Box className="flex-1 rounded-xl p-5 ml-2" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                <Skeleton isDark={isDark} height={36} width={50} style={{ marginBottom: 12 }} />
                <Skeleton isDark={isDark} height={14} width="80%" style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={20} width="60%" borderRadius={10} />
              </Box>
            </HStack>
            <HStack className="space-x-3 mb-3">
              <Box className="flex-1 rounded-xl p-5 mr-2" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                <Skeleton isDark={isDark} height={36} width={50} style={{ marginBottom: 12 }} />
                <Skeleton isDark={isDark} height={14} width="80%" style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={20} width="60%" borderRadius={10} />
              </Box>
              <Box className="flex-1 rounded-xl p-5 ml-2" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1 }}>
                <Skeleton isDark={isDark} height={36} width={50} style={{ marginBottom: 12 }} />
                <Skeleton isDark={isDark} height={14} width="80%" style={{ marginBottom: 8 }} />
                <Skeleton isDark={isDark} height={20} width="60%" borderRadius={10} />
              </Box>
            </HStack>

            {/* Home Course Skeleton */}
            <Box className="rounded-xl p-5 mb-3" style={{ backgroundColor: isDark ? "rgba(22, 22, 24, 0.6)" : "rgba(255, 255, 255, 0.6)", borderColor: "rgba(139, 195, 74, 0.3)", borderWidth: 1, minHeight: 140 }}>
              <Skeleton isDark={isDark} height={36} width={50} style={{ marginBottom: 12 }} />
              <Skeleton isDark={isDark} height={14} width="40%" style={{ marginBottom: 8 }} />
              <Skeleton isDark={isDark} height={20} width="30%" borderRadius={10} />
            </Box>

            {/* Feed List Skeleton */}
            <Box className="w-full rounded-2xl mb-4" style={{ backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)", borderLeftWidth: 6, borderLeftColor: "#8BC34A", borderWidth: 1, borderColor: "rgba(139, 195, 74, 0.3)", borderRadius: 20, overflow: "hidden", padding: 16 }}>
              <HStack className="justify-between items-center mb-4">
                <HStack space="sm" className="items-center">
                  <Skeleton isDark={isDark} width={45} height={45} borderRadius={48} />
                  <VStack space="xs">
                    <Skeleton isDark={isDark} width={120} height={20} style={{ marginBottom: 4 }} />
                    <Skeleton isDark={isDark} width={80} height={12} />
                  </VStack>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        ) : (
          <>
            {/* Overview Stats Cards */}
            {activeTab === "overview" && (
              <VStack className="mt-0 space-y-4">
                {/* Row 1 */}
                <HStack className="space-x-3 mb-3">
                  <Box
                    className="flex-1 rounded-xl p-5 relative min-h-[140px] mr-2"
                    style={{
                      backgroundColor: isDark ? "#161618" : "#fff",
                      borderWidth: 1,
                      borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="location" size={22} color="#FBBF24" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text style={{ color: isDark ? "#fff" : "#111" }} className="text-3xl font-bold">
                        {stats?.coursesPlayed ?? 0}
                      </Text>
                      <Text style={{ color: isDark ? "#D1D5DB" : "#111" }} className="text-sm font-bold">
                        COURSES PLAYED
                      </Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Unique</Text>
                      </Badge>
                    </VStack>
                  </Box>

                  <Box
                    className="flex-1 rounded-xl p-5 relative min-h-[140px] ml-2"
                    style={{
                      backgroundColor: isDark ? "#161618" : "#fff",
                      borderWidth: 1,
                      borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="stats-chart-outline" size={22} color="#06B6D4" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text style={{ color: isDark ? "#fff" : "#111" }} className="text-3xl font-bold">
                        {stats?.averageScore ? stats.averageScore.toFixed(1) : 0}
                      </Text>
                      <Text style={{ color: isDark ? "#D1D5DB" : "#111" }} className="text-sm font-bold">
                        AVG SCORE
                      </Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Per 18 Holes</Text>
                      </Badge>
                    </VStack>
                  </Box>
                </HStack>

                {/* Row 2 */}
                <HStack className="space-x-3 mb-3">
                  <Box
                    className="flex-1 rounded-xl p-5 relative min-h-[140px] mr-2"
                    style={{
                      backgroundColor: isDark ? "#161618" : "#fff",
                      borderWidth: 1,
                      borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="star" size={22} color="#FBBF24" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text style={{ color: isDark ? "#fff" : "#111" }} className="text-3xl font-bold">
                        {stats?.bestScore ?? 0}
                      </Text>
                      <Text style={{ color: isDark ? "#D1D5DB" : "#111" }} className="text-sm font-bold">
                        BEST SCORE
                      </Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Personal Best</Text>
                      </Badge>
                    </VStack>
                  </Box>

                  <Box
                    className="flex-1 rounded-xl p-5 relative min-h-[140px] ml-2"
                    style={{
                      backgroundColor: isDark ? "#161618" : "#fff",
                      borderWidth: 1,
                      borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                    }}
                  >
                    <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                      <Ionicons name="flag" size={22} color="#EF4444" />
                    </Box>

                    <VStack className="space-y-2">
                      <Text style={{ color: isDark ? "#fff" : "#111" }} className="text-3xl font-bold">
                        {profile?.handicapIndex ?? 0}
                      </Text>
                      <Text style={{ color: isDark ? "#D1D5DB" : "#111" }} className="text-sm font-bold">
                        HANDICAP INDEX
                      </Text>
                      <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                        <Text className="text-[10px] font-semibold text-green-800">Portable Index</Text>
                      </Badge>
                    </VStack>
                  </Box>
                </HStack>

                {/* Home Course */}
                <Box
                  className="rounded-xl p-5 relative min-h-[140px]"
                  style={{
                    backgroundColor: isDark ? "#161618" : "#fff",
                    borderWidth: 1,
                    borderColor: isDark ? "#8BC34A" : "#E5E7EB",
                  }}
                >
                  <Box className="absolute top-3 right-3 bg-green-100 p-2 rounded-full">
                    <Ionicons name="home" size={22} color="#8BC34A" />
                  </Box>

                  <VStack className="space-y-2">
                    <Text style={{ color: isDark ? "#fff" : "#111" }} className="text-3xl font-bold">
                      {profile?.handicap ?? 0}
                    </Text>
                    <Text style={{ color: isDark ? "#D1D5DB" : "#111" }} className="text-sm font-bold">
                      HOME COURSE HANDICAP
                    </Text>
                    <Badge className="bg-green-100 px-3 py-1 rounded-full self-start">
                      <Text className="text-[10px] font-semibold text-green-800">No Home Course</Text>
                    </Badge>
                  </VStack>
                </Box>
              </VStack>
            )}

            {/* Tabs Content */}
            <View style={{ display: activeTab === "overview" ? "flex" : "none" }}>
              <OverviewTab cards={cards} handleLike={handleLike} />
            </View>

            <View style={{ display: activeTab === "progress" ? "flex" : "none" }}>
              <InProgressTab
                playerId={profile?.id || 0}
                onDelete={() => { }}
                onResume={(id) => {
                  router.push({
                    pathname: "/(drawer)/(user)/(tabs)/dashboard/tabs/scoreCard/[id]",
                    params: { id: id, handicap: profile?.handicap || 0 }
                  });
                }}
              />
            </View>

            <View style={{ display: activeTab === "history" ? "flex" : "none" }}>
              <HistoryTab
                playerId={profile?.id || 0}
                onViewGame={(id) => console.log("View game", id)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});