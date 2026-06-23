import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  View,
  Text,
  TextInput,
  useColorScheme,
  RefreshControl,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/themed-text";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { HStack } from "@/components/hstack";
import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Dropdown } from "react-native-element-dropdown";
import { useRouter } from "expo-router";
import {
  createMiniTournament,
  getAllTournaments,
  postAcceptanceWeiver,
} from "@/api/modules/admin/tournaments.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCourse } from "@/api/modules/admin/courses.api";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  acceptanceWeiverSchema,
  AcceptanceWeiverType,
  miniTournamentSchema,
  MiniTournamentType,
} from "@/schema/adminSchemas";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

export default function TournamentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [isModalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tModalVisible, setTModalVisible] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [tournaments, setTournaments] = useState<any>([]);
  const [userId, setUserId] = useState<any>("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    control: waiverControl,
    handleSubmit: handleWaiverSubmit,
    reset: resetWaiver,
    watch: watchWaiver,
    formState: { errors: waiverErrors },
  } = useForm<AcceptanceWeiverType>({
    resolver: zodResolver(acceptanceWeiverSchema),
    defaultValues: {
      isUnder18: false,
      agreedToTerms: false,
      parentGuardianName: "",
      parentGuardianMobile: "",
      parentGuardianRelation: "",
    },
  });

  const selectedIsUnder18 = watchWaiver("isUnder18");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MiniTournamentType>({
    resolver: zodResolver(miniTournamentSchema),
    defaultValues: {
      name: "",
      scoringType: "1",
      maxPlayers: 4,
    },
  });

  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const fetchTournaments = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      // postAcceptanceWeiver (tournamentId: number, isUnder18: boolean, parentGuardianMobile: string, parentGuardianName: string, parentGuardianRelation: string)
      const response = await getAllTournaments();

      const gc = await getCourse();
      setTournaments(response);
      setCourses(gc);
    } catch (error) {
      console.error("Fetching tournaments Error:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTournaments();
    } catch (error) {
      console.error("Error refreshing", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // const renderHomeCourse = () => {

  //   return(

  //   )
  // }

  useEffect(() => {
    // console.log(courses);

    const getUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };

    getUserId();
    fetchTournaments();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTournaments();
      // 🔥 refetch when screen is focused again
    }, []),
  );

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const onSubmit = async (data: MiniTournamentType) => {
    // console.log("FORM DATA:", data);
    try {
      setLoading(true);

      const tournamentData = {
        description: "",
        endDate: formatDate(data.endDate),
        maxPlayers: data.maxPlayers,
        name: data.name,
        scoringType: data.scoringType,
        startDate: formatDate(data.startDate),
        teeBoxId: data.teeBox,
        courseId: data.courseId,
      };
      // console.log("FINAL PAYLOAD:", tournamentData);
      await createMiniTournament(
        tournamentData.courseId,
        tournamentData.description,
        tournamentData.endDate,
        tournamentData.maxPlayers,
        tournamentData.name,
        tournamentData.scoringType,
        tournamentData.startDate,
        tournamentData.teeBoxId,
      );

      Toast.show({
        type: "success",
        text1: "Tournament created successfully",
      });

      fetchTournaments();
      reset();
      setTModalVisible(false);
    } catch (error) {
      console.error("Create Tournament Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to create tournament",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptanceWeiver = async (data: AcceptanceWeiverType) => {
    if (!selectedTournament) return;
    try {
      setLoading(true);
      await postAcceptanceWeiver(
        selectedTournament.tournamentId,
        data.isUnder18,
        data.parentGuardianMobile || "",
        data.parentGuardianName || "",
        data.parentGuardianRelation || "",
      );

      Toast.show({
        type: "success",
        text1: "Waiver accepted successfully",
      });
      setModalVisible(false);
      resetWaiver();
      routePage.push(
        `/(drawer)/(user)/(tabs)/tournaments/playScoreCard?tournamentId=${selectedTournament.tournamentId}&courseId=${selectedTournament.courseId}&teeBoxId=${selectedTournament.teeBoxId}&scoringType=${selectedTournament.scoringType}`,
      );
    } catch (error) {
      console.error("Acceptance Waiver Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to accept waiver",
      });
    } finally {
      setLoading(false);
    }
  };

  const TournamentCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: "#8bc34a",
        }}
      >
        {/* Title */}
        <Skeleton isDark={isDark} height={18} width="60%" />

        {/* Description */}
        <Skeleton
          isDark={isDark}
          height={12}
          width="90%"
          style={{ marginTop: 6 }}
        />

        {/* Dates */}
        <HStack className="justify-between mt-3">
          <VStack>
            <Skeleton isDark={isDark} height={10} width={40} />
            <Skeleton
              isDark={isDark}
              height={12}
              width={80}
              style={{ marginTop: 4 }}
            />
          </VStack>

          <VStack>
            <Skeleton isDark={isDark} height={10} width={40} />
            <Skeleton
              isDark={isDark}
              height={12}
              width={80}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>

        {/* Buttons */}
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 12 }}
        />
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 8 }}
        />
        <Skeleton
          isDark={isDark}
          height={36}
          borderRadius={10}
          style={{ marginTop: 8 }}
        />
      </Box>
    );
  };

  const renderHeader = () => {
    const handleCreate = () => setTModalVisible(true);

    return (
      <Box
        style={{
          paddingVertical: 10,
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        {/* 🔝 TOP ROW */}
        <HStack
          style={{
            paddingHorizontal: 16,
            // paddingTop: 14,
            paddingBottom: 10,
            alignItems: "center",
            justifyContent: "center",
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
            Tournaments
          </ThemedText>
        </HStack>

        {/* 🔥 PRIMARY CTA */}
        <Pressable
          onPress={handleCreate}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            backgroundColor: "#84cc16",
          }}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <ThemedText
            style={{
              color: "#fff",
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            Create Mini Tournament
          </ThemedText>
        </Pressable>
      </Box>
    );
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#020617" : "#ffffff" },
        ]}
      >
        <View style={styles.safeArea}>
          <Watermark />

          {/* Header */}
          {renderHeader()}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#8bc34a"]}
                tintColor="#8bc34a"
              />
            }
          >
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} isDark={isDark} />
                ))}
              </>
            ) : (
              <>
                {tournaments.length == 0 ? (
                  <VStack
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 60,
                      paddingHorizontal: 24,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isDark
                          ? "rgba(30,41,59,0.5)"
                          : "rgba(241,245,249,0.8)",
                        padding: 18,
                        borderRadius: 50,
                        marginBottom: 16,
                      }}
                    >
                      <Ionicons name="trophy" size={32} color={"#8bc34a"} />
                    </View>
                    <ThemedText
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      No Tournaments Found
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        color: isDark ? "#94a3b8" : "#64748b",
                        textAlign: "center",
                        lineHeight: 20,
                      }}
                    >
                      You haven't created any tournaments yet. Tap "Create mini
                      Tournament" to start managing your competitions.
                    </ThemedText>
                  </VStack>
                ) : (
                  tournaments.map((tournament: any) => (
                    <React.Fragment key={tournament.tournamentId}>
                      <Box
                        key={tournament.tournamentId}
                        style={[
                          styles.card,
                          {
                            borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            backgroundColor: isDark
                              ? "rgba(15, 23, 42, 0.7)"
                              : "rgba(255, 255, 255, 0.7)",
                          },
                        ]}
                      >
                        {/* Header Section */}
                        <HStack className="justify-between items-start mb-2">
                          <VStack style={{ flex: 1 }}>
                            <ThemedText
                              style={{
                                fontSize: 18,
                                fontWeight: "800",
                                marginBottom: 4,
                              }}
                            >
                              {tournament.name}
                            </ThemedText>
                            {/* <Badge
                              action="info"
                              variant="outline"
                              style={{
                                alignSelf: "flex-start",
                                borderColor: "#8bc34a",
                              }}
                            >
                              <BadgeText
                                style={{ color: "#8bc34a", fontSize: 10 }}
                              >
                                TOURNAMENT
                              </BadgeText>
                            </Badge> */}
                          </VStack>
                          <View style={styles.iconContainer}>
                            <Ionicons name="trophy" size={20} color="#8bc34a" />
                          </View>
                        </HStack>

                        {/* Description */}
                        {tournament.description ? (
                          <ThemedText
                            style={{
                              fontSize: 14,
                              opacity: 0.7,
                              marginBottom: 12,
                            }}
                          >
                            {tournament.description}
                          </ThemedText>
                        ) : (
                          <ThemedText
                            style={{
                              fontSize: 14,
                              opacity: 0.7,
                              marginBottom: 12,
                            }}
                          >
                            No Description
                          </ThemedText>
                        )}

                        {/* Dates Row */}
                        <HStack
                          className="p-3 rounded-xl mb-4"
                          style={{
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                            justifyContent: "space-between",
                          }}
                        >
                          <HStack className="items-center gap-2">
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color="#8bc34a"
                            />
                            <VStack>
                              <ThemedText
                                style={{ fontSize: 10, opacity: 0.5 }}
                              >
                                START
                              </ThemedText>
                              <ThemedText
                                style={{ fontSize: 12, fontWeight: "600" }}
                              >
                                {formatDateTime(tournament.startDate)}
                              </ThemedText>
                            </VStack>
                          </HStack>

                          <HStack className="items-center gap-2">
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color="#ef4444"
                            />
                            <VStack>
                              <ThemedText
                                style={{ fontSize: 10, opacity: 0.5 }}
                              >
                                END
                              </ThemedText>
                              <ThemedText
                                style={{ fontSize: 12, fontWeight: "600" }}
                              >
                                {formatDateTime(tournament.endDate)}
                              </ThemedText>
                            </VStack>
                          </HStack>
                        </HStack>

                        {/* Actions Section */}
                        <VStack className="gap-2">
                          <HStack className="gap-2">
                            {/* View Leaderboard */}
                            <Pressable
                              onPress={() =>
                                routePage.push(
                                  `/tournaments/leaderboardUser?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}&teeboxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                                )
                              }
                              className="flex-1 flex-row justify-center items-center gap-2 border border-[#f59e0b] py-2.5 rounded-xl"
                            >
                              <Ionicons
                                name="stats-chart"
                                size={18}
                                color="#f59e0b"
                              />
                              <ThemedText
                                style={{
                                  color: "#f59e0b",
                                  fontWeight: "700",
                                  fontSize: 13,
                                }}
                              >
                                Leaderboard
                              </ThemedText>
                            </Pressable>

                            {/* My History */}
                            {/* {tournament.isPlayed == true && (
                              <Pressable
                                onPress={() =>
                                  routePage.push(
                                    `/(drawer)/(user)/(tabs)/tournaments/tournamentHistory?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}&teeBoxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                                  )
                                }
                                className="flex-1 flex-row justify-center items-center gap-2 border border-[#06b6d4] py-2.5 rounded-xl"
                              >
                                <Ionicons
                                  name="time"
                                  size={18}
                                  color="#06b6d4"
                                />
                                <ThemedText
                                  style={{
                                    color: "#06b6d4",
                                    fontWeight: "700",
                                    fontSize: 13,
                                  }}
                                >
                                  History
                                </ThemedText>
                              </Pressable>
                            )} */}
                          </HStack>

                          {/* Manage & Play Row */}
                          <HStack className="gap-2">
                            {/* Manage button */}
                            {userId === String(tournament.creatorId) && (
                              <Pressable
                                onPress={() =>
                                  routePage.push(
                                    `/tournaments/manageTournament?tournamentId=${tournament.tournamentId}&tournamentName=${tournament.name}`,
                                  )
                                }
                                className="flex-1 flex-row justify-center items-center gap-2 border border-[#0d6efd] py-2.5 rounded-xl"
                              >
                                <Ionicons
                                  name="settings-outline"
                                  size={18}
                                  color="#0d6efd"
                                />
                                <ThemedText
                                  style={{
                                    color: "#0d6efd",
                                    fontWeight: "700",
                                    fontSize: 13,
                                  }}
                                >
                                  Manage
                                </ThemedText>
                              </Pressable>
                            )}

                            {/* Play Button */}
                            {!tournament.isPlayed && (
                              <Pressable
                                onPress={() => {
                                  if (tournament.creatorId == null) {
                                    setSelectedTournament(tournament);
                                    setModalVisible(true);
                                  } else {
                                    routePage.push(
                                      `/(drawer)/(user)/(tabs)/tournaments/playScoreCard?tournamentId=${tournament.tournamentId}&courseId=${tournament.courseId}&teeBoxId=${tournament.teeBoxId}&scoringType=${tournament.scoringType}`,
                                    );
                                  }
                                }}
                                className="flex-1 flex-row justify-center items-center gap-2 bg-[#8bc34a] py-2.5 rounded-xl"
                              >
                                <Ionicons name="play" size={18} color="white" />
                                <ThemedText
                                  style={{
                                    color: "white",
                                    fontWeight: "700",
                                    fontSize: 14,
                                  }}
                                >
                                  Play Now
                                </ThemedText>
                              </Pressable>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                      {tournament.creatorId == null && (
                        <Modal
                          animationType="slide"
                          transparent
                          visible={isModalVisible}
                          onRequestClose={() => setModalVisible(false)}
                        >
                          <View
                            style={[
                              styles.overlay,
                              {
                                backgroundColor: isDark
                                  ? "rgba(0,0,0,0.7)"
                                  : "rgba(0,0,0,0.5)",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.modalContainer,
                                {
                                  backgroundColor: isDark ? "#121212" : "white",
                                },
                              ]}
                            >
                              {/* HEADER */}
                              <HStack style={styles.header}>
                                <Text style={styles.headerTitle}>
                                  IMPORTANT – LEGAL AGREEMENT
                                </Text>
                              </HStack>

                              <VStack>
                                <ThemedText
                                  style={{
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    fontSize: 17,
                                  }}
                                >
                                  DIGITAL GOLF TOURNAMENT LIABILITY WAIVER
                                </ThemedText>
                                <ThemedText
                                  style={{
                                    textAlign: "center",
                                    fontWeight: "600",
                                  }}
                                >
                                  ASSUMPTION OF RISK & INDEMNITY AGREEMENT
                                </ThemedText>
                              </VStack>
                              {/* BASIC INFO */}
                              <VStack style={styles.infoBox}>
                                <Text
                                  style={{ color: isDark ? "#eee" : "#000" }}
                                >
                                  <Text
                                    style={[
                                      styles.bold,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    Tournament Name:
                                  </Text>
                                  {tournament.name}
                                </Text>
                                <Text
                                  style={{ color: isDark ? "#eee" : "#000" }}
                                >
                                  <Text
                                    style={[
                                      styles.bold,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    Organized By:
                                  </Text>
                                  KOLVE18FREESWING LLP
                                </Text>
                                <Text
                                  style={{ color: isDark ? "#eee" : "#000" }}
                                >
                                  <Text
                                    style={[
                                      styles.bold,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    Effective Date:
                                  </Text>
                                  [Auto-generated upon acceptance]
                                </Text>
                              </VStack>

                              {/* WARNING BOX */}
                              <View
                                style={[
                                  styles.warningBox,
                                  {
                                    backgroundColor: isDark
                                      ? "#3e2723"
                                      : "#fff3cd",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.warningText,
                                    { color: isDark ? "#ffe0b2" : "#854d0e" },
                                  ]}
                                >
                                  Before completing your tournament
                                  registration, you must read and agree to this
                                  Liability Waiver.
                                </Text>
                              </View>

                              {/* WAIVER CONTENT */}
                              <ScrollView showsVerticalScrollIndicator={false}>
                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    1. Assumption of Risk
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I understand that participation in golf
                                    tournaments involves inherent risks
                                    including injury, collisions, equipment
                                    hazards and weather related risks.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    2. Medical Fitness Declaration
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I declare that I am medically fit to
                                    participate in this tournament.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    3. Release of Liability
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I release the organizers and sponsors from
                                    any liability related to injuries, damages
                                    or losses arising from my participation.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    4. Indemnity
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I agree to indemnify the organizers against
                                    claims arising from my participation.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    5. Compliance With Rules
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I will comply with tournament rules and play
                                    fairly.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    6. Personal Property
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    The organizer is not responsible for lost or
                                    stolen property.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    7. Weather & Event Changes
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    The organizer may reschedule or cancel
                                    events due to weather or safety concerns.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    8. Photography & Media Consent
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I grant permission to use images or videos
                                    from the tournament for promotional use.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    9. Digital Scoring & Data Use
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    I agree that scores and tournament data may
                                    be stored digitally.
                                  </Text>
                                </VStack>

                                <VStack style={styles.section}>
                                  <Text
                                    style={[
                                      styles.sectionTitle,
                                      { color: isDark ? "white" : "black" },
                                    ]}
                                  >
                                    10. Governing Law
                                  </Text>
                                  <Text
                                    style={[
                                      styles.sectionText,
                                      { color: isDark ? "#aaa" : "#555" },
                                    ]}
                                  >
                                    This agreement is governed by the laws of
                                    India.
                                  </Text>
                                </VStack>
                              </ScrollView>

                              {/* DIGITAL ACCEPTANCE */}
                              <View style={styles.acceptanceBox}>
                                <Text
                                  style={[
                                    styles.acceptanceTitle,
                                    { color: isDark ? "white" : "black" },
                                  ]}
                                >
                                  DIGITAL ACCEPTANCE
                                </Text>

                                {/* MINOR CHECKBOX */}
                                <Controller
                                  control={waiverControl}
                                  name="isUnder18"
                                  render={({ field: { onChange, value } }) => (
                                    <Pressable
                                      style={styles.checkboxRow}
                                      onPress={() => onChange(!value)}
                                    >
                                      <View
                                        style={[
                                          styles.checkbox,
                                          {
                                            borderColor: isDark
                                              ? "#444"
                                              : "#999",
                                            justifyContent: "center",
                                            alignItems: "center",
                                          },
                                          value && styles.checkboxActive,
                                        ]}
                                      >
                                        {value && (
                                          <Ionicons
                                            name="checkmark"
                                            size={14}
                                            color="white"
                                          />
                                        )}
                                      </View>
                                      <Text
                                        style={[
                                          styles.checkboxText,
                                          { color: isDark ? "#ccc" : "#000" },
                                        ]}
                                      >
                                        I am under 18 years of age
                                      </Text>
                                    </Pressable>
                                  )}
                                />

                                {/* GUARDIAN FORM */}
                                {selectedIsUnder18 && (
                                  <VStack style={styles.guardianForm}>
                                    <ThemedText style={styles.formTitle}>
                                      Parent / Guardian Details
                                    </ThemedText>
                                    <Controller
                                      control={waiverControl}
                                      name="parentGuardianName"
                                      render={({
                                        field: { onChange, value },
                                      }) => (
                                        <TextInput
                                          placeholder="Name"
                                          placeholderTextColor={
                                            isDark ? "#fff" : "#999"
                                          }
                                          style={[
                                            styles.input,
                                            {
                                              backgroundColor: isDark
                                                ? "#1a1a1a"
                                                : "#fff",
                                              color: isDark ? "#fff" : "#000",
                                            },
                                          ]}
                                          value={value}
                                          onChangeText={onChange}
                                        />
                                      )}
                                    />
                                    {waiverErrors.parentGuardianName && (
                                      <Text
                                        style={{ color: "red", fontSize: 12 }}
                                      >
                                        {
                                          waiverErrors.parentGuardianName
                                            .message
                                        }
                                      </Text>
                                    )}

                                    <Controller
                                      control={waiverControl}
                                      name="parentGuardianMobile"
                                      render={({
                                        field: { onChange, value },
                                      }) => (
                                        <TextInput
                                          placeholder="Mobile Number"
                                          placeholderTextColor={
                                            isDark ? "#fff" : "#999"
                                          }
                                          keyboardType="phone-pad"
                                          style={[
                                            styles.input,
                                            {
                                              backgroundColor: isDark
                                                ? "#1a1a1a"
                                                : "#fff",
                                              color: isDark ? "#fff" : "#000",
                                            },
                                          ]}
                                          value={value}
                                          onChangeText={onChange}
                                        />
                                      )}
                                    />
                                    {waiverErrors.parentGuardianMobile && (
                                      <Text
                                        style={{ color: "red", fontSize: 12 }}
                                      >
                                        {
                                          waiverErrors.parentGuardianMobile
                                            .message
                                        }
                                      </Text>
                                    )}

                                    <Controller
                                      control={waiverControl}
                                      name="parentGuardianRelation"
                                      render={({
                                        field: { onChange, value },
                                      }) => (
                                        <TextInput
                                          placeholder="Relation"
                                          placeholderTextColor={
                                            isDark ? "#fff" : "#999"
                                          }
                                          style={[
                                            styles.input,
                                            {
                                              backgroundColor: isDark
                                                ? "#1a1a1a"
                                                : "#fff",
                                              color: isDark ? "#fff" : "#000",
                                            },
                                          ]}
                                          value={value}
                                          onChangeText={onChange}
                                        />
                                      )}
                                    />
                                    {waiverErrors.parentGuardianRelation && (
                                      <Text
                                        style={{ color: "red", fontSize: 12 }}
                                      >
                                        {
                                          waiverErrors.parentGuardianRelation
                                            .message
                                        }
                                      </Text>
                                    )}
                                  </VStack>
                                )}

                                {/* ACCEPT CHECKBOX */}
                                <Controller
                                  control={waiverControl}
                                  name="agreedToTerms"
                                  render={({ field: { onChange, value } }) => (
                                    <Pressable
                                      style={styles.checkboxRow}
                                      onPress={() => onChange(!value)}
                                    >
                                      <View
                                        style={[
                                          styles.checkbox,
                                          {
                                            borderColor: isDark
                                              ? "#444"
                                              : "#999",
                                            justifyContent: "center",
                                            alignItems: "center",
                                          },
                                          value && styles.checkboxActive,
                                        ]}
                                      >
                                        {value && (
                                          <Ionicons
                                            name="checkmark"
                                            size={14}
                                            color="white"
                                          />
                                        )}
                                      </View>
                                      <Text
                                        style={[
                                          styles.checkboxText,
                                          { color: isDark ? "#ccc" : "#000" },
                                        ]}
                                      >
                                        I confirm I have read and agree to the
                                        terms above.
                                      </Text>
                                    </Pressable>
                                  )}
                                />
                                {waiverErrors.agreedToTerms && (
                                  <Text style={{ color: "red", fontSize: 12 }}>
                                    {waiverErrors.agreedToTerms.message}
                                  </Text>
                                )}
                              </View>

                              {/* ACTION BUTTONS */}
                              <HStack style={styles.buttonRow}>
                                <Pressable
                                  onPress={() => {
                                    setModalVisible(false);
                                    reset();
                                    Toast.show({
                                      type: "error",
                                      text1:
                                        "You must accept the waiver to play the game",
                                    });
                                  }}
                                  style={styles.declineBtn}
                                >
                                  <Text
                                    style={{
                                      color: "#e53935",
                                      fontWeight: "600",
                                    }}
                                  >
                                    DECLINE
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={handleWaiverSubmit(
                                    handleAcceptanceWeiver,
                                  )}
                                  style={styles.acceptBtn}
                                >
                                  <Text
                                    style={{ color: "#fff", fontWeight: "600" }}
                                  >
                                    I AGREE & REGISTER
                                  </Text>
                                </Pressable>
                              </HStack>
                            </View>
                          </View>
                        </Modal>
                      )}
                    </React.Fragment>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Create mini tournament modal */}
      <Modal animationType="slide" transparent visible={tModalVisible}>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* HEADER */}
              <HStack className="justify-between items-center mb-4">
                <ThemedText
                  style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
                >
                  Create Mini Tournament
                </ThemedText>

                <Pressable
                  onPress={() => {
                    reset();
                    setTModalVisible(false);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={isDark ? "white" : "black"}
                  />
                </Pressable>
              </HStack>
              {/* TOURNAMENT NAME */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Tournament Name
              </Text> */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter Tournament Name"
                    placeholderTextColor={isDark ? "#fff" : "#999"}
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                        color: isDark ? "#fff" : "#000",
                      },
                    ]}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && (
                <Text style={{ color: "red" }}>*{errors.name.message}</Text>
              )}

              {/* DATE ROW */}
              <HStack style={styles.row}>
                <VStack style={{ flex: 1 }}>
                  {/* <Text
                    style={[
                      styles.label,
                      { color: isDark ? "white" : "black" },
                    ]}
                  >
                    Start Date
                  </Text> */}

                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowStartPicker(true)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              borderColor: isDark ? "#333" : "#ddd",
                            },
                          ]}
                        >
                          <Text style={{ color: isDark ? "white" : "black" }}>
                            {value
                              ? value?.toDateString()
                              : "Select start Date"}
                          </Text>
                        </Pressable>

                        {showStartPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            maximumDate={watch("endDate") || undefined} // ✅ restrict
                            onChange={(e, selectedDate) => {
                              setShowStartPicker(false);
                              if (selectedDate) onChange(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                  {errors.startDate && (
                    <Text style={{ color: "red" }}>
                      *{errors.startDate.message}
                    </Text>
                  )}
                </VStack>

                <VStack style={{ flex: 1 }}>
                  {/* <Text
                    style={[
                      styles.label,
                      { color: isDark ? "white" : "black" },
                    ]}
                  >
                    End Date
                  </Text> */}

                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <Pressable
                          onPress={() => setShowEndPicker(true)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? "#1a1a1a" : "#fff",
                              borderColor: isDark ? "#333" : "#ddd",
                            },
                          ]}
                        >
                          <Text style={{ color: isDark ? "white" : "black" }}>
                            {value ? value?.toDateString() : "Select End Date"}
                          </Text>
                        </Pressable>

                        {showEndPicker && (
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            minimumDate={watch("startDate") || new Date()} // ✅ restrict
                            onChange={(e, selectedDate) => {
                              setShowEndPicker(false);
                              if (selectedDate) onChange(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                  {errors.endDate && (
                    <Text style={{ color: "red" }}>
                      *{errors.endDate.message}
                    </Text>
                  )}
                </VStack>
              </HStack>

              {/* COURSE */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Course
              </Text> */}
              <Controller
                control={control}
                name="courseId"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#fff" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Course"
                    data={
                      courses?.map((item: any) => {
                        return {
                          label: item.name,
                          value: item.courseId,
                        };
                      }) || []
                    }
                    labelField="label"
                    valueField="value"
                    mode="modal"
                    maxHeight={200}
                    value={value}
                    onChange={(item) => {
                      onChange(item.value);
                      setSelectedCourse(item.value);
                    }}
                  />
                )}
              />
              {errors.courseId && (
                <Text style={{ color: "red" }}>*{errors.courseId.message}</Text>
              )}

              {/* TEE BOX */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Tee Box
              </Text> */}

              <Controller
                control={control}
                name="teeBox"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    mode="modal"
                    maxHeight={200}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Tee Box"
                    data={
                      courses
                        .find((c: any) => c.courseId === selectedCourse)
                        ?.teeBoxes?.map((item: any) => {
                          return {
                            label:
                              item.name +
                              " (Slope:" +
                              item.slope +
                              " / " +
                              "Rating:" +
                              item.rating +
                              ")",
                            value: item.teeBoxId,
                          };
                        }) || []
                    }
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => {
                      onChange(Number(item.value));
                    }}
                  />
                )}
              />
              {errors.teeBox && (
                <Text style={{ color: "red" }}>*{errors.teeBox.message}</Text>
              )}

              {/* SCORING TYPE */}
              {/* <Text
                style={[styles.label, { color: isDark ? "white" : "black" }]}
              >
                Scoring Type
              </Text> */}
              <Controller
                control={control}
                name="scoringType"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Scoring Type"
                    data={[
                      { label: "Standard (Gross/Net)", value: "standard" },
                      { label: "Excluded(practice)", value: "excluded" },
                      { label: "Stableford", value: "stableford" },
                      { label: "DP Gross / Net", value: "double-peoria-net" },
                      {
                        label: "DP Stableford",
                        value: "double-peoria-stableford",
                      },
                    ]}
                    labelField="label"
                    valueField="value"
                    mode="modal"
                    value={value}
                    onChange={(item) => {
                      onChange(item.value);
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="maxPlayers"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? "#1a1a1a" : "#fff",
                        borderColor: isDark ? "#333" : "#ddd",
                      },
                    ]}
                    placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                    selectedTextStyle={{ color: isDark ? "white" : "black" }}
                    containerStyle={{
                      backgroundColor: isDark ? "#1a1a1a" : "#fff",
                      borderColor: isDark ? "#333" : "#ddd",
                    }}
                    itemTextStyle={{ color: isDark ? "white" : "black" }}
                    activeColor={isDark ? "#333" : "#f0f0f0"}
                    placeholder="Select Max Players"
                    data={[
                      { label: "4 Players", value: 4 },
                      { label: "8 Players", value: 8 },
                      { label: "16 Players", value: 16 },
                    ]}
                    labelField="label"
                    valueField="value"
                    mode="modal"
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                )}
              />
              {errors.maxPlayers && (
                <Text style={{ color: "red" }}>
                  *{errors.maxPlayers.message}
                </Text>
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
                  reset();
                  setTModalVisible(false);
                }}
              >
                <Text style={{ color: isDark ? "#ccc" : "#333" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                style={styles.createBtn}
              >
                <Text style={{ color: "#fff" }}>Create Tournament</Text>
              </Pressable>
            </HStack>
          </View>
        </View>

        {/* START DATE PICKER */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {/* END DATE PICKER */}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 9,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.one,
    // paddingBottom: BottomTabInset + Spacing.two,
    maxWidth: MaxContentWidth,
    marginBottom: 50,
  },

  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  list: {
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },

  card: {
    borderRadius: 14,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  description: {
    opacity: 0.6,
  },

  dateRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },

  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  dateText: {
    fontSize: 12,
  },

  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
  },

  secondaryButtonText: {
    fontWeight: "500",
  },

  outlineButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
    borderWidth: 1,
  },

  outlineButtonText: {
    fontWeight: "500",
    color: "#06b6d4",
  },
  outlineButtonText2: {
    fontWeight: "500",
    color: "#f59e0b",
  },
  outlineButtonText3: {
    fontWeight: "500",
    color: "#0d6efd",
  },

  playText: {
    color: "white",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 10,
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    maxHeight: "90%",
  },

  header: {
    justifyContent: "center",
    marginBottom: 10,
  },

  headerTitle: {
    fontWeight: "700",
    fontSize: 19,
    color: "#dc3545",
  },

  infoBox: {
    marginBottom: 10,
  },

  bold: {
    fontWeight: "600",
  },

  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  warningText: {
    color: "#854d0e",
    fontWeight: "500",
  },

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontWeight: "600",
  },

  sectionText: {
    fontSize: 13,
    color: "#555",
  },

  acceptanceBox: {
    marginTop: 10,
  },

  acceptanceTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#999",
    marginRight: 10,
    borderRadius: 4,
  },

  checkboxActive: {
    backgroundColor: "#8bc34a",
    borderColor: "#8bc34a",
  },

  checkboxText: {
    flex: 1,
  },

  guardianForm: {
    marginBottom: 10,
  },

  formTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },

  buttonRow: {
    justifyContent: "space-between",
    marginTop: 10,
  },

  declineBtn: {
    borderWidth: 1,
    borderColor: "#e53935",
    padding: 10,
    borderRadius: 5,
  },

  acceptBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 10,
  },

  row: {
    gap: 10,
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
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginTop: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(139, 195, 74, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
