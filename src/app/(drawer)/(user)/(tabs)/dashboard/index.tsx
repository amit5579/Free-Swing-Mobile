import { Badge } from "@/components/badge";
import { Box } from "@/components/box";
import { HStack } from "@/components/hstack";
import { VStack } from "@/components/vstack";
import { Divider } from "@/components/divider";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Text,
  View,
  TextInput,
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
import { useRouter, useFocusEffect } from "expo-router";


const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 3 * CARD_MARGIN - 32) / 2;
const COMPACT_CARD_WIDTH = (SCREEN_WIDTH - 64 - 64) / 3; 

export default function DashboardScreen() {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const statsScrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const [stats, setStats] = useState<ScoreStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statsScrollIndex, setStatsScrollIndex] = useState(0);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const tabs = [
    { key: "overview", label: "Overview", icon: "grid-outline" },
    { key: "progress", label: "In Progress", icon: "hourglass-outline" },
    { key: "history", label: "Game History", icon: "time-outline" },
  ];

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchFeed();
      fetchStats();
      fetchProfile();
    }, [])
  );

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

    } catch (error) {
      console.error("Like toggle error:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#FFFFFF" }}>
      <Watermark />

      <View
        style={{
          padding: 16,
          backgroundColor: isDark ? "#161618" : "#FFFFFF",
          zIndex: 10,
        }}
      >
        {loading ? (
          <VStack className="mb-4 space-y-3">
            <Skeleton isDark={isDark} height={45} width="100%" borderRadius={12} />
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
          <>
            <Box
              className="flex-row items-center px-4 mb-4 rounded-xl border h-11"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
                borderColor: isDark ? "rgba(139,195,74,0.3)" : "rgba(229,231,235,1)",
              }}
            >
              <Ionicons name="search-outline" size={18} color="#8BC34A" />
              <TextInput
                placeholder={
                  activeTab === "overview"
                    ? "Search game feed..."
                    : activeTab === "progress"
                      ? "Search in progress..."
                      : "Search game history..."
                }
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: isDark ? "#fff" : "#111",
                  fontSize: 14,
                }}
              />
              {searchQuery !== "" && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={isDark ? "#6B7280" : "#9CA3AF"} />
                </Pressable>
              )}
            </Box>

            <HStack
              className="rounded-full p-1 justify-between"
              style={{
                // backgroundColor: isDark ? "rgba(31,31,31,0.6)" : "rgba(229,231,235,0.6)", 
                backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.35)",
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? "#FFFFFF" : "transparent",
              }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      setActiveTab(tab.key);
                      const tIndex = tabs.findIndex((t) => t.key === tab.key);
                      scrollViewRef.current?.scrollTo({ x: tIndex * SCREEN_WIDTH, animated: true });
                    }}
                    className="px-4 py-2 rounded-full flex-row items-center justify-center"
                    style={{
                      flex: 1,
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
                      numberOfLines={1}
                      adjustsFontSizeToFit
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

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const tabIndex = Math.round(offsetX / SCREEN_WIDTH);
            if (tabs[tabIndex]) {
              const newTab = tabs[tabIndex].key;
              if (activeTab !== newTab) setActiveTab(newTab);
            }
          }}
        >
          <View style={{ width: SCREEN_WIDTH }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
              {loading ? (
                <VStack className="space-y-4 pt-4">
                  <Box
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.6)",
                      borderColor: "rgba(139, 195, 74, 0.3)",
                      borderWidth: 1,
                    }}
                  >
                    <VStack space="sm">
                      <HStack space="sm" className="items-center">
                        {[1, 2, 3].map((i) => (
                          <Box
                            key={i}
                            className="rounded-xl p-2 items-center"
                            style={{
                              width: COMPACT_CARD_WIDTH,
                              minHeight: 100,
                              backgroundColor: isDark ? "rgba(31, 31, 31, 0.5)" : "rgba(243, 244, 246, 0.8)",
                              borderColor: "rgba(139, 195, 74, 0.2)",
                              borderWidth: 1
                            }}
                          >
                            <Skeleton isDark={isDark} height={16} width={16} borderRadius={8} style={{ marginBottom: 6 }} />
                            <Skeleton isDark={isDark} height={18} width="60%" style={{ marginBottom: 6 }} />
                            <Skeleton isDark={isDark} height={8} width="80%" style={{ marginBottom: 6 }} />
                            <Skeleton isDark={isDark} height={10} width="40%" borderRadius={5} />
                          </Box>
                        ))}
                      </HStack>

                      <HStack space="xs" className="justify-center items-center mt-2">
                        <Skeleton isDark={isDark} width={20} height={6} borderRadius={3} />
                        <Skeleton isDark={isDark} width={6} height={6} borderRadius={3} />
                      </HStack>
                    </VStack>
                  </Box>

                  <HStack className="justify-between items-center mb-4 mt-4">
                    <HStack space="sm" className="items-center">
                      <Skeleton isDark={isDark} width={120} height={28} />
                      <Skeleton isDark={isDark} width={60} height={24} borderRadius={20} />
                    </HStack>
                  </HStack>

                  <Box className="w-full rounded-2xl mb-4" style={{ backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)", borderLeftWidth: 6, borderLeftColor: "#8BC34A", borderWidth: 1, borderColor: "rgba(139, 195, 74, 0.3)", borderRadius: 20, overflow: "hidden", padding: 16 }}>
                    <HStack className="justify-between items-center mb-4">
                      <HStack space="sm" className="items-center">
                        <Skeleton isDark={isDark} width={36} height={36} borderRadius={18} />
                        <VStack space="xs">
                          <Skeleton isDark={isDark} width={100} height={16} borderRadius={4} />
                          <Skeleton isDark={isDark} width={60} height={8} borderRadius={4} />
                        </VStack>
                      </HStack>
                      <Skeleton isDark={isDark} width={16} height={16} borderRadius={8} />
                    </HStack>

                    <HStack space="xs" className="mb-4 justify-between">
                      {[0, 1, 2, 3].map((i) => (
                        <Box key={i} className="rounded-xl items-center py-2 border" style={{ width: "23.5%", backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.4)", borderColor: "rgba(139,195,74,0.15)" }}>
                          <Skeleton isDark={isDark} width={15} height={6} style={{ marginBottom: 4 }} borderRadius={3} />
                          <Skeleton isDark={isDark} width={25} height={12} borderRadius={3} />
                        </Box>
                      ))}
                    </HStack>

                    <Divider style={{ backgroundColor: isDark ? "rgba(51,51,51,0.2)" : "rgba(229,231,235,0.2)", marginBottom: 12 }} />
                    <HStack className="justify-between items-center">
                      <HStack space="md">
                        <Skeleton isDark={isDark} width={40} height={24} borderRadius={12} />
                        <Skeleton isDark={isDark} width={50} height={24} borderRadius={12} />
                      </HStack>
                      <Skeleton isDark={isDark} width={60} height={28} borderRadius={14} />
                    </HStack>
                  </Box>

                  {[1, 2].map((i) => (
                    <Box key={i} className="w-full rounded-2xl mb-4" style={{ backgroundColor: isDark ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.7)", borderLeftWidth: 6, borderLeftColor: "#8BC34A", borderWidth: 1, borderColor: "rgba(139, 195, 74, 0.3)", borderRadius: 20, overflow: "hidden", padding: 16 }}>
                      <HStack className="justify-between items-center">
                        <HStack space="sm" className="items-center">
                          <Skeleton isDark={isDark} width={36} height={36} borderRadius={18} />
                          <VStack space="xs">
                            <Skeleton isDark={isDark} width={100} height={16} borderRadius={4} />
                            <Skeleton isDark={isDark} width={60} height={8} borderRadius={4} />
                          </VStack>
                        </HStack>
                        <Skeleton isDark={isDark} width={16} height={16} borderRadius={8} />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <>
                  {!searchQuery && (
                    <Box
                      className="rounded-2xl p-4"
                      style={{
                        backgroundColor: isDark ? "rgba(22, 22, 24, 0.4)" : "rgba(255, 255, 255, 0.8)",
                        borderColor: "rgba(139, 195, 74, 0.3)",
                        borderWidth: 1,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }}
                    >
                      <VStack space="sm">
                        <ScrollView
                          ref={statsScrollViewRef}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          snapToInterval={2 * (COMPACT_CARD_WIDTH + 8)}
                          snapToAlignment="start"
                          decelerationRate="fast"
                          nestedScrollEnabled={true}
                          contentContainerStyle={{ flexGrow: 1 }}
                          onScroll={(event) => {
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const index = Math.round(offsetX / (2 * (COMPACT_CARD_WIDTH + 8)));
                            setStatsScrollIndex(index);
                          }}
                          scrollEventThrottle={16}
                        >
                          <HStack space="sm" className="items-center">
                            {[
                              { label: "COURSES PLAYED", value: stats?.coursesPlayed ?? 0, icon: "location", color: "#FBBF24", badge: "Unique" },
                              { label: "AVG SCORE", value: stats?.averageScore ? stats.averageScore.toFixed(1) : 0, icon: "stats-chart-outline", color: "#06B6D4", badge: "Per 18" },
                              { label: "BEST SCORE", value: stats?.bestScore ?? 0, icon: "star", color: "#FBBF24", badge: "PB" },
                              { label: "HANDICAP INDEX", value: profile?.handicapIndex ?? 0, icon: "flag", color: "#EF4444", badge: "Index" },
                              { label: "HOME HANDICAP", value: profile?.handicap ?? 0, icon: "home", color: "#8BC34A", badge: "Local" },
                            ].map((stat, index) => (
                              <Box
                                key={index}
                                className="rounded-xl p-2 items-center"
                                style={{
                                  width: COMPACT_CARD_WIDTH,
                                  minWidth: COMPACT_CARD_WIDTH,
                                  flexShrink: 0,
                                  minHeight: 100,
                                  backgroundColor: isDark ? "rgba(31, 31, 31, 0.6)" : "rgba(243, 244, 246, 0.7)",
                                  borderColor: "rgba(139, 195, 74, 0.2)",
                                  borderWidth: 1
                                }}
                              >
                                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                                <Text style={{ color: isDark ? "#fff" : "#111", fontSize: 16 }} className="font-bold mt-1">
                                  {stat.value}
                                </Text>
                                <Text
                                  style={{ color: isDark ? "#D1D5DB" : "#4B5563", fontSize: 7, textAlign: 'center' }}
                                  className="font-bold mt-1"
                                  numberOfLines={2}
                                >
                                  {stat.label}
                                </Text>
                                <Box className="bg-green-100 px-1 py-0.5 rounded-full mt-1">
                                  <Text className="text-[6px] font-bold text-green-800 uppercase">{stat.badge}</Text>
                                </Box>
                              </Box>
                            ))}
                          </HStack>
                        </ScrollView>

                        <HStack space="xs" className="justify-center items-center mt-2">
                          {[0, 1].map((i) => (
                            <Box
                              key={i}
                              style={{
                                width: statsScrollIndex === i ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: statsScrollIndex === i ? "#8BC34A" : (isDark ? "#4B5563" : "#D1D5DB")
                              }}
                            />
                          ))}
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                  {searchQuery !== "" && (
                    <Box className="mt-2 mb-2">
                      <Text className="text-2xl font-bold" style={{ color: isDark ? "#fff" : "#000" }}>
                        Game Feed Results
                      </Text>
                    </Box>
                  )}
                  <Box className="mt-0">
                    <OverviewTab
                      cards={cards.filter(c =>
                        c.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.course.toLowerCase().includes(searchQuery.toLowerCase())
                      )}
                      handleLike={handleLike}
                      searchQuery={searchQuery}
                      isSearchFocused={isSearchFocused}
                    />
                  </Box>
                </>
              )}
            </ScrollView>
          </View>

          <View style={{ width: SCREEN_WIDTH }}>
            <InProgressTab
              playerId={profile?.id || 0}
              searchQuery={searchQuery}
              onDelete={() => { }}
              onResume={(id) => {
                router.push({
                  pathname: "/(drawer)/(user)/scorecard/resume/[id]",
                  params: { id: id, handicap: profile?.handicap || 0 }
                });
              }}
            />
          </View>

          <View style={{ width: SCREEN_WIDTH }}>
            <HistoryTab
              playerId={profile?.id || 0}
              searchQuery={searchQuery}
              onViewGame={(id) => console.log("View game", id)}
            />
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
