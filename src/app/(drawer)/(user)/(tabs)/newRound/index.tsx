import React, { useEffect, useState, useCallback } from "react";
import { Alert, StyleSheet, TextInput } from "react-native";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getCourse } from "@/api/modules/admin/courses.api";
import { Divider } from "@/components/divider";
import { Skeleton } from "@/components/Skeleton";
import { Dropdown } from "react-native-element-dropdown";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
} from "@/components/radio";
import {
  getCourseBySearch,
  getHandicapDetails,
  saveExternalCourse,
} from "@/api/modules/newRound.api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newRoundSchema, NewRoundFormValues } from "@/schema/userSchemas";
import Toast from "react-native-toast-message";
import { getAllPlayers } from "@/api/modules/admin/tournaments.api";
import { getProfile } from "@/api/modules/profile.api";

export default function StartNewRoundPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [courseList, setCourseList] = useState<any>([]);
  const [playerList, setPlayerList] = useState<any>([]);
  const [searchedCourseList, setSearchedCourseList] = useState<any>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const uu = await getProfile();
      const ccs = await getCourse();
      const gp = await getAllPlayers();
      setProfile(uu);
      setCourseList(ccs);
      setPlayerList(gp);
    } catch (error) {
      console.log("Error fetching courses", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
    fetchCourses();
  }, []);

  const handleSearch = async (showSearchLoading = true) => {
    if (!search.trim()) {
      setSearchedCourseList([]);
      return;
    }
    try {
      if (showSearchLoading) setSearchLoading(true);
      const response = await getCourseBySearch(search);
      setSearchedCourseList(response || []);
    } catch (error) {
      console.error("Error searching courses", error);
    } finally {
      if (showSearchLoading) setSearchLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (search.trim()) {
        await handleSearch(false);
      }
      await fetchCourses();
    } catch (error) {
      console.error("Error refreshing", error);
    } finally {
      setRefreshing(false);
    }
  }, [search]);

  const handleCourseSave = async (sourceCourse: any) => {
    try {
      setSearchLoading(true);
      await saveExternalCourse(sourceCourse);
      Toast.show({ type: "success", text1: "Course added successfully" });

      // Refresh local course list
      fetchCourses();

      // Update the searched list to show "Saved" for this course
      setSearchedCourseList((prevList: any[]) =>
        prevList.map((c) =>
          c.externalCourseId === sourceCourse.id
            ? { ...c, alreadyImported: true }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error saving courses", error);
      Toast.show({ type: "error", text1: "Failed to add course" });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [search]);

  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            alignItems: "center",
          }}
        >
          {/* 🧠 TITLE */}
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#fff" : "#020617",
            }}
          >
            Start New Round
          </ThemedText>

          {/* 📌 SUBTITLE */}
          <ThemedText
            style={{
              marginTop: 4,
              fontSize: 13,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            Select a course to begin your round
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const CourseCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="rounded-2xl p-5 relative"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
          marginBottom: 12,
        }}
      >
        {/* Badge */}
        <Skeleton
          isDark={isDark}
          height={20}
          width={60}
          borderRadius={20}
          style={{ position: "absolute", top: 12, right: 12 }}
        />

        {/* Icon */}
        <Skeleton
          isDark={isDark}
          height={28}
          width={28}
          borderRadius={6}
          style={{ marginBottom: 12 }}
        />

        {/* Title */}
        <Skeleton
          isDark={isDark}
          height={18}
          width="60%"
          style={{ marginBottom: 10 }}
        />

        {/* Row */}
        <HStack className="justify-between">
          <Skeleton isDark={isDark} height={14} width="40%" />
          <Skeleton isDark={isDark} height={14} width="30%" />
        </HStack>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "#262626" : "#e5e5e5",
            marginVertical: 12,
          }}
        />

        {/* Button */}
        <Skeleton isDark={isDark} height={36} borderRadius={10} />
      </Box>
    );
  };

  const SearchCourseSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <HStack className="justify-between items-start mb-4">
          <View style={{ flex: 1 }}>
            <Skeleton isDark={isDark} height={18} width="70%" />
            <Skeleton
              isDark={isDark}
              height={14}
              width="40%"
              style={{ marginTop: 6 }}
            />
          </View>
          <Skeleton isDark={isDark} height={24} width={50} borderRadius={6} />
        </HStack>
        <Skeleton
          isDark={isDark}
          height={14}
          width="90%"
          style={{ marginBottom: 12 }}
        />
        <HStack className="gap-2">
          <Skeleton isDark={isDark} height={24} width={80} borderRadius={12} />
          <Skeleton isDark={isDark} height={24} width={80} borderRadius={12} />
          <Skeleton isDark={isDark} height={24} width={100} borderRadius={12} />
        </HStack>
      </View>
    );
  };

  const filteredLocalCourses = courseList.filter((course: any) => {
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    const nameMatch = course.name?.toLowerCase().includes(query);
    const locationMatch = course.location?.toLowerCase().includes(query);
    return nameMatch || locationMatch;
  });

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        {/* Header */}

        <RenderHeader />
        <Watermark />

        {/* 🔍 SEARCH BAR */}
        {!loading && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}
            >
              <Ionicons name="search" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <TextInput
                placeholder="Search courses by name or location..."
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1,
                  color: isDark ? "#fff" : "#000",
                  fontSize: 15,
                  paddingVertical: 0,
                }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8bc34a"]}
              tintColor="#8bc34a"
            />
          }
        >
          <VStack className="px-4 pt-6 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CourseCardSkeleton key={i} isDark={isDark} />
                  ))}
                </>
              ) : (
                <>
                  {search.trim().length > 0 ? (
                    <>
                      {/* My Saved Courses matching the query */}
                      {filteredLocalCourses.length > 0 && (
                        <VStack className="mb-6">
                          <ThemedText
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              marginBottom: 12,
                              color: "#8bc34a",
                            }}
                          >
                            My Courses ({filteredLocalCourses.length})
                          </ThemedText>
                          {filteredLocalCourses.map((course: any) => (
                            <CourseCard
                              key={course.courseId}
                              course={course}
                              isDark={isDark}
                              playerList={playerList}
                              profile={profile}
                            />
                          ))}
                        </VStack>
                      )}

                      {/* Online Database Search results */}
                      <HStack className="justify-between items-center mb-4">
                        <VStack>
                          <ThemedText
                            style={{ fontSize: 16, fontWeight: "700" }}
                          >
                            Online Database Results
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontSize: 12,
                              color: isDark ? "#94a3b8" : "#64748b",
                            }}
                          >
                            Query: {search}
                          </ThemedText>
                        </VStack>
                        <Box className="bg-[#f1f5f9] px-2 py-1 rounded-md">
                          <ThemedText
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#475569",
                            }}
                          >
                            {searchedCourseList.length} result(s)
                          </ThemedText>
                        </Box>
                      </HStack>

                      {searchLoading ? (
                        <>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <SearchCourseSkeleton key={i} isDark={isDark} />
                          ))}
                        </>
                      ) : searchedCourseList.length > 0 ? (
                        searchedCourseList.map((course: any) => (
                          <ExternalCourseCard
                            key={course.externalCourseId}
                            course={course}
                            isDark={isDark}
                            handleCourseSave={handleCourseSave}
                          />
                        ))
                      ) : (
                        <ThemedText
                          style={{ textAlign: "center", marginVertical: 20 }}
                        >
                          No online golf courses found for "{search}"
                        </ThemedText>
                      )}
                    </>
                  ) : (
                    courseList.map((course: any) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        isDark={isDark}
                        playerList={playerList}
                        profile={profile}
                      />
                    ))
                  )}
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </View>
    </>
  );
}

/* ---------- EXTERNAL COURSE CARD ---------- */
function ExternalCourseCard({ course, isDark, handleCourseSave }: any) {
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <Box
      className="rounded-2xl p-4 mb-4"
      style={{
        borderWidth: 1,
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      }}
    >
      {/* Top Row: Name and ID */}
      <HStack className="justify-between items-start mb-1">
        <VStack className="flex-1 mr-2">
          <ThemedText
            style={{ fontSize: 17, fontWeight: "700", color: textColor }}
          >
            {course.courseName}
          </ThemedText>
          <ThemedText style={{ fontSize: 13, color: subTextColor }}>
            {course.clubName}
          </ThemedText>
        </VStack>
        <Box className="bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
          <ThemedText
            style={{ fontSize: 10, fontWeight: "700", color: "#64748b" }}
          >
            ID {course.externalCourseId}
          </ThemedText>
        </Box>
      </HStack>

      {/* Save Button Row */}
      <HStack className="justify-end mb-3">
        {course.alreadyImported ? (
          <Box className="flex-row items-center gap-1 border border-[#8bc34a] px-4 py-1.5 rounded-lg bg-[#f0f9eb]">
            <Ionicons name="checkmark-circle" size={16} color="#8bc34a" />
            <ThemedText
              style={{ fontSize: 13, fontWeight: "700", color: "#8bc34a" }}
            >
              Saved
            </ThemedText>
          </Box>
        ) : (
          <Pressable
            onPress={() => handleCourseSave(course.sourceCourse)}
            className="flex-row items-center gap-1 bg-[#8bc34a] px-5 py-2 rounded-lg"
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="download-outline" size={16} color="#fff" />
            <ThemedText
              style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}
            >
              Save
            </ThemedText>
          </Pressable>
        )}
      </HStack>

      {/* Address Row */}
      <HStack className="items-start gap-1 mb-4 pr-4">
        <Ionicons
          name="location"
          size={16}
          color="#ef4444"
          style={{ marginTop: 2 }}
        />
        <ThemedText
          numberOfLines={2}
          style={{ fontSize: 13, color: subTextColor, lineHeight: 18, flex: 1 }}
        >
          {course.address || "Address not available"}
        </ThemedText>
      </HStack>

      {/* Bottom Badges */}
      <HStack className="gap-2 flex-wrap">
        <Box className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-full">
          <ThemedText
            style={{ fontSize: 11, fontWeight: "600", color: "#475569" }}
          >
            Male Tees: {course.maleTeeCount}
          </ThemedText>
        </Box>
        <Box className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-full">
          <ThemedText
            style={{ fontSize: 11, fontWeight: "600", color: "#475569" }}
          >
            Female Tees: {course.femaleTeeCount}
          </ThemedText>
        </Box>
        <Box
          className="px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: course.alreadyImported ? "#ecfdf5" : "#f1f5f9",
            borderWidth: 1,
            borderColor: course.alreadyImported ? "#10b981" : "#94a3b8",
          }}
        >
          <ThemedText
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: course.alreadyImported ? "#047857" : "#475569",
            }}
          >
            {course.alreadyImported ? "Already in DB" : "Not saved locally"}
          </ThemedText>
        </Box>
      </HStack>
    </Box>
  );
}

/* ---------- COURSE CARD ---------- */
function CourseCard({ course, isDark, playerList = [], profile = null }: any) {
  const routePage = useRouter();

  /* ---------- CONSTANTS ---------- */
  const scoringOptions = {
    net_including: { excluded: false, stableford: false },
    net_excluding: { excluded: true, stableford: false },
    stableford: { excluded: false, stableford: true },
    gross_score: { excluded: false, stableford: false, gross: true },
    split_six: { excluded: false, stableford: false, split_six: true },
    high_low: { excluded: false, stableford: false, high_low: true },
    nassau_best: { excluded: false, stableford: false, nassau_best: true },
    nassau_combined: {
      excluded: false,
      stableford: false,
      nassau_combined: true,
    },
  };

  const holesOptions = {
    "18": "18",
    front9: "front9",
    back9: "back9",
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [teeBoxList, setTeeBoxList] = useState<any[]>([]);
  const [handicapDetails, setHandicapDetails] = useState<any>([]);
  const [handicapView, setHandicapView] = useState(false);

  const [numberOfPlayers, setNumberOfPlayers] = useState<string>("solo");
  const [player2, setPlayer2] = useState<any>(null);
  const [player3, setPlayer3] = useState<any>(null);
  const [player4, setPlayer4] = useState<any>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewRoundFormValues>({
    resolver: zodResolver(newRoundSchema),
    defaultValues: {
      teeBoxId: 0,
      scoreType: "net_including",
      holesToPlay: "18",
    },
  });

  const selectedTeeBoxId = watch("teeBoxId");
  const scoreType = watch("scoreType");
  const holesToPlay = watch("holesToPlay");

  // Auto-set numberOfPlayers and handle dropdown logic based on scoring mode
  useEffect(() => {
    if (
      scoreType === "net_including" ||
      scoreType === "net_excluding" ||
      scoreType === "stableford"
    ) {
      setNumberOfPlayers("solo");
    } else if (scoreType === "split_six") {
      setNumberOfPlayers("3");
    } else if (scoreType === "high_low") {
      setNumberOfPlayers("4");
    } else if (scoreType === "nassau_best" || scoreType === "nassau_combined") {
      setValue("holesToPlay", "18");
      if (numberOfPlayers !== "2" && numberOfPlayers !== "4") {
        Alert.alert(
          "Invalid Player Count",
          "You can select 2 or 4 players for this scoring mode.",
          [{ text: "OK", onPress: () => setNumberOfPlayers("2") }],
        );
      }
    }
  }, [scoreType]);

  // Clean up selected players when numberOfPlayers decreases
  useEffect(() => {
    if (numberOfPlayers === "solo") {
      setPlayer2(null);
      setPlayer3(null);
      setPlayer4(null);
    } else if (numberOfPlayers === "2") {
      setPlayer3(null);
      setPlayer4(null);
    } else if (numberOfPlayers === "3") {
      setPlayer4(null);
    }
  }, [numberOfPlayers]);

  const getPlayerOptions = (currentPlayerId: any, otherPlayerIds: any[]) => {
    return playerList
      .filter((p: any) => {
        if (p.subscriptionStatus === "Blocked") {
          return false;
        }
        if (profile && p.id === profile.id) return false;
        if (otherPlayerIds.includes(p.id) && p.id !== currentPlayerId)
          return false;
        return true;
      })
      .map((p: any) => ({
        label: p.username,
        value: p.id,
      }));
  };

  const savePendingRoundContext = async () => {
    const playerCount =
      numberOfPlayers === "solo" ? 1 : Number(numberOfPlayers);
    const sideGameMode =
      scoreType === "high_low"
        ? "high-low"
        : scoreType === "split_six"
          ? "split-six"
          : "none";

    if (playerCount <= 1 && sideGameMode === "none") {
      return undefined;
    }

    const roundPlayers: any[] = [];

    // Player 1 (You)
    if (profile) {
      roundPlayers.push({
        playerId: profile.id,
        userId: profile.id,
        name: (profile.username || "You").trim(),
      });
    }

    // Player 2
    if (player2) {
      const p2Obj = playerList.find((p: any) => p.id === player2);
      if (p2Obj) {
        roundPlayers.push({
          playerId: p2Obj.id,
          userId: p2Obj.id,
          name: (p2Obj.username || "").trim(),
        });
      }
    }

    // Player 3
    if (player3) {
      const p3Obj = playerList.find((p: any) => p.id === player3);
      if (p3Obj) {
        roundPlayers.push({
          playerId: p3Obj.id,
          userId: p3Obj.id,
          name: (p3Obj.username || "").trim(),
        });
      }
    }

    // Player 4
    if (player4) {
      const p4Obj = playerList.find((p: any) => p.id === player4);
      if (p4Obj) {
        roundPlayers.push({
          playerId: p4Obj.id,
          userId: p4Obj.id,
          name: (p4Obj.username || "").trim(),
        });
      }
    }

    const context = {
      players: roundPlayers.slice(0, playerCount).map((player, index) => ({
        playerId: `p${index + 1}`,
        userId: player.userId,
        name: player.name,
        isPrimary: index === 0,
        team: sideGameMode === "high-low" ? (index < 2 ? 1 : 2) : undefined,
      })),
      matchScoringMode: sideGameMode,
      createdAt: new Date().toISOString(),
    };

    const contextId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      await AsyncStorage.setItem(
        `pending_round_context_v1_${contextId}`,
        JSON.stringify(context),
      );
    } catch (e) {
      console.error("Error saving pending round context", e);
    }
    return contextId;
  };
  const textColor = isDark ? "#fff" : "#000";
  const subTextColor = isDark ? "#aaa" : "#555";
  const cardBg = isDark ? "#1e1e1e" : "#f9f9f9";
  const borderColor = isDark ? "#333" : "#ddd";

  const fetchHandiCap = async () => {
    try {
      const response = await getHandicapDetails(selectedTeeBoxId);
      setHandicapDetails(response);
    } catch (error) {
      console.error("Fetching handicap scorecard Error:", error);
      throw error;
    }
  };
  useEffect(() => {
    if (selectedTeeBoxId > 0) {
      fetchHandiCap();
    }
  }, [selectedTeeBoxId]);

  const selectedScore = scoringOptions[scoreType];
  const selectedHoles = holesOptions[holesToPlay];

  return (
    <>
      <Box
        className="rounded-2xl p-5 relative"
        style={{
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
        }}
      >
        {/* Free Badge */}
        <Box
          className="absolute top-3 right-3 px-3 py-1 rounded-full"
          style={{
            backgroundColor:
              course.isPremium === false ? "#8b8b8bff" : "#EFBF04",
          }}
        >
          <ThemedText
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: course.isPremium ? "#3D2412" : "#fff",
            }}
          >
            {course.isPremium === false ? "Free" : "Premium"}
          </ThemedText>
        </Box>

        {/* Flag */}
        <HStack className="mb-3">
          <Svg width={28} height={28} viewBox="0 0 448 512">
            <Path
              fill="#8bc34a"
              d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V480c0 17.7 14.3 32 32 32s32-14.3 32-32V358.4l62.7-18.8c41.9-12.6 87.1-8.7 126.2 10.9 42.7 21.4 92.5 24 137.2 7.2l37.1-13.9c12.5-4.7 20.8-16.6 20.8-30V65.1c0-23-24.2-38-44.8-27.7l-11.8 5.9c-44.9 22.5-97.8 22.5-142.8 0-36.4-18.2-78.3-21.8-117.2-10.1L64 54.4V32z"
            />
          </Svg>
        </HStack>

        {/* Course Name */}
        <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
          {course.name}
          {/* {courseList.name} */}
        </ThemedText>

        <HStack className="justify-between gap-4">
          {/* Location */}
          <HStack className="items-center mt-2" style={{ flex: 1 }}>
            <Ionicons name="location" size={18} color="#ef4444" />
            <ThemedText
              numberOfLines={2}
              style={{
                marginLeft: 6,
                fontSize: 14,
                opacity: 0.7,
                flex: 1,
              }}
            >
              {course.location}
              {/* course location */}
            </ThemedText>
          </HStack>
        </HStack>
        {/* Tee Boxes */}
        <HStack className="items-center mt-2" style={{ flexShrink: 0 }}>
          <Ionicons name="cube" size={18} color="blue" />
          <ThemedText
            style={{
              marginLeft: 6,
              fontSize: 14,
              opacity: 0.7,
            }}
          >
            {course.teeBoxes.length} Tee Boxes
          </ThemedText>
        </HStack>
        <Divider className="my-3 h-[1px] bg-[#e5e5e5]" />

        <Pressable
          onPress={() => {
            setModalVisible(true);
            setTeeBoxList(course.teeBoxes);
            reset(); // reset form to defaults
            setNumberOfPlayers("solo");
            setPlayer2(null);
            setPlayer3(null);
            setPlayer4(null);
          }}
          className="mt-3 rounded-xl py-2 items-center border border-[#8bc34a] flex-row justify-center gap-2"
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#8bc34a" : "transparent",
          })}
        >
          {({ pressed }) => (
            <>
              <Ionicons
                name={pressed ? "apps" : "apps-outline"}
                size={18}
                color={pressed ? "white" : "#8bc34a"}
              />
              <ThemedText
                style={{
                  color: pressed ? "white" : "#8bc34a",
                  fontWeight: "600",
                }}
              >
                Select Tee Box
              </ThemedText>
            </>
          )}
        </Pressable>
      </Box>

      <Modal animationType="slide" transparent visible={modalVisible}>
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#121212" : "#fff" },
            ]}
          >
            {/* HEADER */}
            <HStack className="justify-between items-center mb-4">
              <ThemedText
                style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
              >
                Select Tee Box
              </ThemedText>

              <Pressable
                onPress={() => {
                  reset();
                  setHandicapView(false);
                  setModalVisible(false);
                  setNumberOfPlayers("solo");
                  setPlayer2(null);
                  setPlayer3(null);
                  setPlayer4(null);
                }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "white" : "black"}
                />
              </Pressable>
            </HStack>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={{ fontSize: 13 }}>
                You are now starting a round for {course.name}
              </ThemedText>
              <Controller
                control={control}
                name="teeBoxId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    backgroundColor={
                      isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                    }
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: cardBg,
                        borderColor: errors.teeBoxId ? "#ef4444" : borderColor,
                        borderWidth: 1,
                      },
                    ]}
                    placeholderStyle={{ color: subTextColor }}
                    selectedTextStyle={{ color: textColor }}
                    itemTextStyle={{ color: textColor }}
                    containerStyle={{
                      backgroundColor: isDark ? "#333" : "#eee",
                      borderRadius: 8,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: borderColor,
                    }}
                    itemContainerStyle={{
                      backgroundColor: isDark ? "#333" : "#eee",
                    }}
                    activeColor={isDark ? "#333" : "#eee"}
                    data={teeBoxList.map((item: any) => ({
                      ...item,
                      label: `${item.name} (Slope:${item.slope} / Rating:${item.rating})`,
                    }))}
                    labelField="label"
                    valueField="teeBoxId"
                    mode="modal"
                    placeholder={"Choose Tee Box"}
                    value={value}
                    onChange={(item: any) => {
                      // console.log("TeeItem", item);
                      setHandicapView(true);
                      onChange(item.teeBoxId);
                    }}
                  />
                )}
              />
              {errors.teeBoxId && (
                <Text style={styles.errorText}>{errors.teeBoxId.message}</Text>
              )}

              {handicapView && (
                <HStack
                  className={`justify-between items-center rounded-md p-3 border ${isDark ? "border-gray-700" : "border-gray-300"}`}
                >
                  <VStack>
                    <ThemedText>Your Handicap</ThemedText>
                    <ThemedText>
                      Based on Index: {handicapDetails.handicapIndex}
                    </ThemedText>
                  </VStack>
                  <ThemedText style={{ fontSize: 20, fontWeight: 700 }}>
                    {handicapDetails.handicap}
                  </ThemedText>
                </HStack>
              )}

              <View style={styles.container}>
                <Controller
                  control={control}
                  name="scoreType"
                  render={({ field: { onChange, value } }) => (
                    <RadioGroup value={value} onChange={onChange}>
                      <ThemedText style={{ color: textColor, marginBottom: 3 }}>
                        Scoring Mode
                      </ThemedText>

                      {[
                        {
                          label: "Net Score (including par 3)",
                          value: "net_including",
                        },
                        {
                          label: "Net Score (excluding par 3)",
                          value: "net_excluding",
                        },
                        {
                          label: "Stableford Scoring",
                          value: "stableford",
                        },
                        {
                          label: "Gross Scorecard",
                          value: "gross_score",
                        },
                        {
                          label: "Split Six",
                          value: "split_six",
                        },
                        {
                          label: "High Low",
                          value: "high_low",
                        },
                        {
                          label: "Nassau (Best Score)",
                          value: "nassau_best",
                        },
                        {
                          label: "Nassau (Combined Score)",
                          value: "nassau_combined",
                        },
                      ].map((item) => (
                        <Radio
                          key={item.value}
                          value={item.value}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 10,
                          }}
                        >
                          <RadioIndicator
                            style={{
                              borderColor: textColor,
                              borderWidth: 2,
                              marginRight: 10,
                            }}
                          >
                            {value === item.value && (
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: textColor,
                                }}
                              />
                            )}
                          </RadioIndicator>

                          <RadioLabel style={{ color: textColor }}>
                            {item.label}
                          </RadioLabel>
                        </Radio>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.scoreType && (
                  <Text style={styles.errorText}>
                    {errors.scoreType.message}
                  </Text>
                )}
              </View>

              {/* Number of Players & Player Slots Selection */}
              <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <ThemedText
                  style={{
                    color: textColor,
                    marginBottom: 6,
                    fontWeight: "600",
                  }}
                >
                  Number of Players
                </ThemedText>
                <Dropdown
                  backgroundColor={
                    isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                  }
                  disable={
                    scoreType === "net_including" ||
                    scoreType === "net_excluding" ||
                    scoreType === "stableford" ||
                    scoreType === "split_six" ||
                    scoreType === "high_low"
                  }
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor:
                        scoreType === "net_including" ||
                        scoreType === "net_excluding" ||
                        scoreType === "stableford" ||
                        scoreType === "split_six" ||
                        scoreType === "high_low"
                          ? isDark
                            ? "#222"
                            : "#f1f5f9"
                          : cardBg,
                      borderColor: borderColor,
                      borderWidth: 1,
                      marginTop: 0,
                      opacity:
                        scoreType === "net_including" ||
                        scoreType === "net_excluding" ||
                        scoreType === "stableford" ||
                        scoreType === "split_six" ||
                        scoreType === "high_low"
                          ? 0.7
                          : 1,
                    },
                  ]}
                  placeholderStyle={{ color: subTextColor, fontSize: 14 }}
                  selectedTextStyle={{ color: textColor, fontSize: 14 }}
                  itemTextStyle={{ color: textColor, fontSize: 14 }}
                  containerStyle={{
                    backgroundColor: isDark ? "#333" : "#eee",
                    borderRadius: 8,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                  itemContainerStyle={{
                    backgroundColor: isDark ? "#333" : "#eee",
                  }}
                  activeColor={isDark ? "#333" : "#eee"}
                  data={[
                    { label: "Solo", value: "solo" },
                    { label: "2 Players", value: "2" },
                    { label: "3 Players", value: "3" },
                    { label: "4 Players", value: "4" },
                  ]}
                  labelField="label"
                  valueField="value"
                  mode="modal"
                  placeholder="Select number of players"
                  value={numberOfPlayers}
                  onChange={(item: any) => {
                    if (
                      (scoreType === "nassau_best" ||
                        scoreType === "nassau_combined") &&
                      (item.value === "solo" || item.value === "3")
                    ) {
                      Alert.alert(
                        "Invalid Player Count",
                        "You can select 2 or 4 players for this scoring mode.",
                        [
                          {
                            text: "OK",
                            onPress: () => setNumberOfPlayers("2"),
                          },
                        ],
                      );
                    } else {
                      setNumberOfPlayers(item.value);
                    }
                  }}
                />
              </View>

              {/* Players selection dropdowns */}
              <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                {numberOfPlayers === "solo" ? (
                  /* Solo: Player 1 (You) takes full width */
                  <View style={{ width: "100%" }}>
                    <HStack
                      style={{ alignItems: "center", gap: 6, marginBottom: 4 }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: textColor,
                        }}
                      >
                        Player 1
                      </ThemedText>
                      {scoreType === "high_low" && (
                        <View
                          style={{
                            backgroundColor: "#dcfce7",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#166534",
                              fontWeight: "700",
                            }}
                          >
                            Team 1
                          </Text>
                        </View>
                      )}
                    </HStack>
                    <Dropdown
                      disable
                      renderRightIcon={() => null}
                      backgroundColor={
                        isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                      }
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: isDark ? "#222" : "#f1f5f9",
                          borderColor: borderColor,
                          borderWidth: 1,
                          marginTop: 0,
                          height: 44,
                          opacity: 0.7,
                        },
                      ]}
                      placeholderStyle={{ color: subTextColor, fontSize: 14 }}
                      selectedTextStyle={{
                        color: isDark ? "#aaa" : "#555",
                        fontSize: 14,
                      }}
                      data={[
                        { label: profile?.username || "You", value: "you" },
                      ]}
                      labelField="label"
                      valueField="value"
                      value="you"
                      onChange={() => {}}
                    />
                  </View>
                ) : (
                  /* Multiplayer: Player 1 & 2 in Row 1 */
                  <View>
                    <HStack style={{ gap: 12, marginBottom: 12 }}>
                      {/* Player 1 (You) */}
                      <View style={{ flex: 1 }}>
                        <HStack
                          style={{
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: textColor,
                            }}
                          >
                            Player 1
                          </ThemedText>
                          {(scoreType === "high_low" ||
                            scoreType === "nassau_best" ||
                            scoreType === "nassau_combined") && (
                            <View
                              style={{
                                backgroundColor: "#dcfce7",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: "#166534",
                                  fontWeight: "700",
                                }}
                              >
                                Team 1
                              </Text>
                            </View>
                          )}
                        </HStack>
                        <Dropdown
                          disable
                          renderRightIcon={() => null}
                          backgroundColor={
                            isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                          }
                          style={[
                            styles.dropdown,
                            {
                              backgroundColor: isDark ? "#222" : "#f1f5f9",
                              borderColor: borderColor,
                              borderWidth: 1,
                              marginTop: 0,
                              height: 44,
                              opacity: 0.7,
                            },
                          ]}
                          placeholderStyle={{
                            color: subTextColor,
                            fontSize: 14,
                          }}
                          selectedTextStyle={{
                            color: isDark ? "#aaa" : "#555",
                            fontSize: 14,
                          }}
                          data={[
                            { label: profile?.username || "You", value: "you" },
                          ]}
                          labelField="label"
                          valueField="value"
                          value="you"
                          onChange={() => {}}
                        />
                      </View>

                      {/* Player 2 */}
                      <View style={{ flex: 1 }}>
                        <HStack
                          style={{
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: textColor,
                            }}
                          >
                            Player 2
                          </ThemedText>
                          {(scoreType === "high_low" ||
                            ((scoreType === "nassau_best" ||
                              scoreType === "nassau_combined") &&
                              numberOfPlayers === "4")) && (
                            <View
                              style={{
                                backgroundColor: "#dcfce7",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: "#166534",
                                  fontWeight: "700",
                                }}
                              >
                                Team 1
                              </Text>
                            </View>
                          )}
                          {(scoreType === "nassau_best" ||
                            scoreType === "nassau_combined") &&
                            numberOfPlayers === "2" && (
                              <View
                                style={{
                                  backgroundColor: "#dbeafe",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: "#1e40af",
                                    fontWeight: "700",
                                  }}
                                >
                                  Team 2
                                </Text>
                              </View>
                            )}
                        </HStack>
                        <Dropdown
                          backgroundColor={
                            isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                          }
                          style={[
                            styles.dropdown,
                            {
                              backgroundColor: cardBg,
                              borderColor: borderColor,
                              borderWidth: 1,
                              marginTop: 0,
                              height: 44,
                            },
                          ]}
                          placeholderStyle={{
                            color: subTextColor,
                            fontSize: 14,
                          }}
                          selectedTextStyle={{ color: textColor, fontSize: 14 }}
                          itemTextStyle={{ color: textColor, fontSize: 14 }}
                          containerStyle={{
                            backgroundColor: isDark ? "#333" : "#eee",
                            borderRadius: 8,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: borderColor,
                          }}
                          itemContainerStyle={{
                            backgroundColor: isDark ? "#333" : "#eee",
                          }}
                          activeColor={isDark ? "#333" : "#eee"}
                          data={getPlayerOptions(player2, [player3, player4])}
                          labelField="label"
                          valueField="value"
                          mode="modal"
                          placeholder="Select Player"
                          value={player2}
                          onChange={(item: any) => {
                            setPlayer2(item.value);
                          }}
                        />
                      </View>
                    </HStack>

                    {/* Row 2: Player 3 and Player 4 */}
                    {(numberOfPlayers === "3" || numberOfPlayers === "4") && (
                      <HStack style={{ gap: 12, marginBottom: 12 }}>
                        {/* Player 3 */}
                        <View style={{ flex: 1 }}>
                          <HStack
                            style={{
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: textColor,
                              }}
                            >
                              Player 3
                            </ThemedText>
                            {(scoreType === "high_low" ||
                              scoreType === "nassau_best" ||
                              scoreType === "nassau_combined") && (
                              <View
                                style={{
                                  backgroundColor: "#dbeafe",
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    color: "#1e40af",
                                    fontWeight: "700",
                                  }}
                                >
                                  Team 2
                                </Text>
                              </View>
                            )}
                          </HStack>
                          <Dropdown
                            backgroundColor={
                              isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                            }
                            style={[
                              styles.dropdown,
                              {
                                backgroundColor: cardBg,
                                borderColor: borderColor,
                                borderWidth: 1,
                                marginTop: 0,
                                height: 44,
                              },
                            ]}
                            placeholderStyle={{
                              color: subTextColor,
                              fontSize: 14,
                            }}
                            selectedTextStyle={{
                              color: textColor,
                              fontSize: 14,
                            }}
                            itemTextStyle={{ color: textColor, fontSize: 14 }}
                            containerStyle={{
                              backgroundColor: isDark ? "#333" : "#eee",
                              borderRadius: 8,
                              overflow: "hidden",
                              borderWidth: 1,
                              borderColor: borderColor,
                            }}
                            itemContainerStyle={{
                              backgroundColor: isDark ? "#333" : "#eee",
                            }}
                            activeColor={isDark ? "#333" : "#eee"}
                            data={getPlayerOptions(player3, [player2, player4])}
                            labelField="label"
                            valueField="value"
                            mode="modal"
                            placeholder="Select Player"
                            value={player3}
                            onChange={(item: any) => {
                              setPlayer3(item.value);
                            }}
                          />
                        </View>

                        {/* Player 4 */}
                        <View style={{ flex: 1 }}>
                          {numberOfPlayers === "4" ? (
                            <>
                              <HStack
                                style={{
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 4,
                                }}
                              >
                                <ThemedText
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "600",
                                    color: textColor,
                                  }}
                                >
                                  Player 4
                                </ThemedText>
                                {(scoreType === "high_low" ||
                                  scoreType === "nassau_best" ||
                                  scoreType === "nassau_combined") && (
                                  <View
                                    style={{
                                      backgroundColor: "#dbeafe",
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        color: "#1e40af",
                                        fontWeight: "700",
                                      }}
                                    >
                                      Team 2
                                    </Text>
                                  </View>
                                )}
                              </HStack>
                              <Dropdown
                                backgroundColor={
                                  isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"
                                }
                                style={[
                                  styles.dropdown,
                                  {
                                    backgroundColor: cardBg,
                                    borderColor: borderColor,
                                    borderWidth: 1,
                                    marginTop: 0,
                                    height: 44,
                                  },
                                ]}
                                placeholderStyle={{
                                  color: subTextColor,
                                  fontSize: 14,
                                }}
                                selectedTextStyle={{
                                  color: textColor,
                                  fontSize: 14,
                                }}
                                itemTextStyle={{
                                  color: textColor,
                                  fontSize: 14,
                                }}
                                containerStyle={{
                                  backgroundColor: isDark ? "#333" : "#eee",
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  borderWidth: 1,
                                  borderColor: borderColor,
                                }}
                                itemContainerStyle={{
                                  backgroundColor: isDark ? "#333" : "#eee",
                                }}
                                activeColor={isDark ? "#333" : "#eee"}
                                data={getPlayerOptions(player4, [
                                  player2,
                                  player3,
                                ])}
                                labelField="label"
                                valueField="value"
                                mode="modal"
                                placeholder="Select Player"
                                value={player4}
                                onChange={(item: any) => {
                                  setPlayer4(item.value);
                                }}
                              />
                            </>
                          ) : (
                            <View style={{ flex: 1 }} />
                          )}
                        </View>
                      </HStack>
                    )}
                  </View>
                )}
              </View>

              {/* Holes to play */}
              <View style={styles.container}>
                <Controller
                  control={control}
                  name="holesToPlay"
                  render={({ field: { onChange, value } }) => (
                    <RadioGroup value={value} onChange={onChange}>
                      <ThemedText style={{ color: textColor, marginBottom: 3 }}>
                        Holes to Play
                      </ThemedText>

                      {[
                        {
                          label: "18 Holes",
                          value: "18",
                        },
                        {
                          label: "Front Nine (1-9)",
                          value: "front9",
                        },
                        {
                          label: "Back Nine (10-18)",
                          value: "back9",
                        },
                      ].map((item) => {
                        const isDisabled =
                          (scoreType === "nassau_best" ||
                            scoreType === "nassau_combined") &&
                          (item.value === "front9" || item.value === "back9");
                        return (
                          <Radio
                            key={item.value}
                            value={item.value}
                            isDisabled={isDisabled}
                            style={{
                              flexDirection: "row",
                              marginBottom: 10,
                              opacity: isDisabled ? 0.4 : 1,
                            }}
                          >
                            <RadioIndicator
                              style={{
                                borderColor: textColor,
                                borderWidth: 2,
                                marginRight: 10,
                              }}
                            >
                              {value === item.value && (
                                <View
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: textColor,
                                  }}
                                />
                              )}
                            </RadioIndicator>

                            <RadioLabel style={{ color: textColor }}>
                              {item.label}
                            </RadioLabel>
                          </Radio>
                        );
                      })}
                    </RadioGroup>
                  )}
                />
                {errors.holesToPlay && (
                  <Text style={styles.errorText}>
                    {errors.holesToPlay.message}
                  </Text>
                )}
              </View>

              {/* start from */}
              {(scoreType === "nassau_best" ||
                scoreType === "nassau_combined") && (
                <View style={styles.container}>
                  <Controller
                    control={control}
                    name="startFrom"
                    render={({ field: { onChange, value } }) => (
                      <RadioGroup value={value} onChange={onChange}>
                        <ThemedText
                          style={{ color: textColor, marginBottom: 3 }}
                        >
                          Which nine would you like to play first?
                        </ThemedText>

                        {[
                          {
                            label: "Hole 1 (Front Nine First)",
                            value: "front",
                          },
                          {
                            label: "Hole 10 (Back Nine First)",
                            value: "back",
                          },
                        ].map((item) => {
                          // const isDisabled =
                          //   (scoreType === "net_including" ||
                          //     scoreType === "net_excluding" ||
                          //     scoreType === "stableford" ||
                          //     scoreType === "gross_score" ||
                          //     scoreType === "split_six" ||
                          //     scoreType === "high_low") &&
                          //   (item.value === "fnf" || item.value === "bnf");
                          return (
                            <Radio
                              key={item.value}
                              value={item.value}
                              // isDisabled={isDisabled}
                              style={{
                                flexDirection: "row",
                                marginBottom: 10,
                                // opacity: isDisabled ? 0.4 : 1,
                              }}
                            >
                              <RadioIndicator
                                style={{
                                  borderColor: textColor,
                                  borderWidth: 2,
                                  marginRight: 10,
                                }}
                              >
                                {value === item.value && (
                                  <View
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 5,
                                      backgroundColor: textColor,
                                    }}
                                  />
                                )}
                              </RadioIndicator>

                              <RadioLabel style={{ color: textColor }}>
                                {item.label}
                              </RadioLabel>
                            </Radio>
                          );
                        })}
                      </RadioGroup>
                    )}
                  />
                  {errors.startFrom && (
                    <Text style={styles.errorText}>
                      {errors.startFrom.message}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* BUTTONS */}
            <HStack style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.cancelBtn,
                  { borderColor: isDark ? "#444" : "#ccc" },
                ]}
                onPress={() => {
                  setHandicapView(false);
                  setModalVisible(false);
                  setNumberOfPlayers("solo");
                  setPlayer2(null);
                  setPlayer3(null);
                  setPlayer4(null);
                }}
              >
                <Text style={{ color: isDark ? "#ccc" : "#333" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit(async (data) => {
                  // Validate players selection
                  if (numberOfPlayers === "2" && !player2) {
                    Alert.alert("Please select Player 2");
                    return;
                  }
                  if (numberOfPlayers === "3" && (!player2 || !player3)) {
                    Alert.alert("Please select all players");
                    return;
                  }
                  if (
                    numberOfPlayers === "4" &&
                    (!player2 || !player3 || !player4)
                  ) {
                    Alert.alert("Please select all players");
                    return;
                  }

                  const selectedScore = scoringOptions[data.scoreType];
                  const selectedHoles = holesOptions[data.holesToPlay];
                  const startFrom = data.startFrom || "";

                  // Save player configuration to AsyncStorage
                  try {
                    await AsyncStorage.setItem(
                      "numberOfPlayers",
                      numberOfPlayers,
                    );
                    await AsyncStorage.setItem(
                      "player2Id",
                      player2 ? String(player2) : "",
                    );
                    await AsyncStorage.setItem(
                      "player3Id",
                      player3 ? String(player3) : "",
                    );
                    await AsyncStorage.setItem(
                      "player4Id",
                      player4 ? String(player4) : "",
                    );
                  } catch (e) {
                    console.error("Error saving player selections", e);
                  }

                  const roundContextId = await savePendingRoundContext();

                  setHandicapView(false);
                  setModalVisible(false);

                  let url = `/newRound/scoreCardUser?selectedScore=${JSON.stringify(selectedScore)}&holes=${selectedHoles}&handicap=${handicapDetails.handicap}&courseId=${course.courseId}&teeBoxId=${data.teeBoxId}&numberOfPlayers=${numberOfPlayers}&player2Id=${player2 || ""}&player3Id=${player3 || ""}&player4Id=${player4 || ""}&forceNew=true&startFrom=${startFrom}`;
                  if (roundContextId) {
                    url += `&roundContextId=${roundContextId}`;
                  }

                  routePage.push(url as any);
                })}
                style={styles.createBtn}
              >
                <Text style={{ color: "#fff" }}>Start Game</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 3,
    borderRadius: 7,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContainer: {
    width: "95%",
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#818589",
    borderRadius: 10,
    padding: 14,
    // marginBottom: 9,
    fontSize: 16,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#8bc34a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },

  handicapCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },

  cancelButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  startButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 1,
  },
  buttonRow: {
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  createBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 8,
  },
});
