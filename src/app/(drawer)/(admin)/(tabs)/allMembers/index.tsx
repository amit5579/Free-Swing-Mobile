import React, { useState, useEffect, useCallback } from "react";
import {
  Pressable,
  useColorScheme,
  ActivityIndicator,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";
import { Avatar, AvatarImage } from "@/components/avatar";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { UserIcon } from "lucide-react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  approveSubscription,
  approveUser,
  blockUser,
  createMember,
  getUsers,
  rejectSubscription,
  UserListApi,
} from "@/api/admin/allMembers";
import { Skeleton } from "@/components/Skeleton";
import { addMemberSchema, AddMemberType } from "@/schema/adminSchemas";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { getCourse } from "@/api/admin/courses";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "react-native";

export default function AllMembersScreen({
  hideAdminControls = false,
  searchQuery = "",
}: { hideAdminControls?: boolean; searchQuery?: string } = {}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [modalVisible, setModalVisible] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All"); // All, Pending, Active, Blocked

  const tabs = ["All", "Pending", "Active", "Blocked"];

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      member.username.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.id.toString().includes(query);

    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Pending")
      return matchesSearch && member.hasPendingSubscriptionRequest;
    if (activeTab === "Active")
      return (
        matchesSearch &&
        !member.isBlocked &&
        !member.hasPendingSubscriptionRequest
      );
    if (activeTab === "Blocked") return matchesSearch && member.isBlocked;
    return matchesSearch;
  });
  // ── Form ──
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberType>({
    resolver: zodResolver(addMemberSchema) as any,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      membershipNo: "",
      mobileNumber: "",
      dateOfBirth: "",
      teeBoxId: 0,
      homeCourseId: 0,
      homeCourse: "",
      handicap: 0,
      handicapIndex: 0,
      courseSlope: 0,
      courseRating: 0,
    },
  });
  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      setUserRole(storedRole?.toLowerCase() || null);
    };
    loadRole();
    fetchUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, []),
  );

  const now = new Date();

  const formatDate = (dateString: any) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };
  // ── Colors ──
  const colors = {
    bg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark ? "#1e293b" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    dimText: isDark ? "#64748b" : "#94a3b8",
    accent: "#84cc16",
    accentSoft: isDark ? "rgba(132,204,22,0.15)" : "rgba(132,204,22,0.1)",
    statusActive: "#22c55e",
    statusBlocked: "#ef4444",
    divider: isDark ? "#1e293b" : "#f1f5f9",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
    modalBg: isDark ? "#1e293b" : "#ffffff",
    inputBg: isDark ? "#0f172a" : "#f8fafc",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    disabledBg: isDark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.6)",
  };

  const handleCreate = async (data: AddMemberType) => {
    try {
      setSubmitting(true);
      const payload = {
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        handicap: data.handicap,
        handicapIndex: data.handicapIndex,
        homeCourseId: data.homeCourseId,
        homeCourse: data.homeCourse,
        membershipNo: data.membershipNo,
        mobileNumber: data.mobileNumber,
        password: data.password,
        rating: data.courseRating,
        slope: data.courseSlope,
        username: data.username,
        teeBoxId: data.teeBoxId,
      };
      await createMember(payload);
      Toast.show({
        type: "success",
        text1: "Member created successfully",
      });
      reset();
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.log("Failed to create member", error);
      Toast.show({
        type: "error",
        text1: "Failed to create member",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlanApprove = async (id: number) => {
    Alert.alert("Approve Plan", "Are you sure you want to approve this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            console.log("id is ", id, "type is ", typeof id);

            await approveSubscription(id);
            fetchUsers();
            Toast.show({
              type: "success",
              text1: "Member approved successfully",
            });
          } catch (error) {
            console.log("Failed to approve member", error);

            Toast.show({
              type: "error",
              text1: "Failed to approve member",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handlePlanDenay = async (id: number) => {
    Alert.alert("Denay Plan", "Are you sure you want to denay this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Denay",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            console.log("id is ", id, "type is ", typeof id);

            await rejectSubscription(id);
            fetchUsers();
            Toast.show({
              type: "success",
              text1: "Subscription request denayed successfully",
            });
          } catch (error) {
            console.log("Failed to denay Subscription request", error);

            Toast.show({
              type: "error",
              text1: "Failed to denay Subscription request",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleApprove = async (id: number) => {
    Alert.alert(
      "Approve Member",
      "Are you sure you want to approve this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log("id is ", id, "type is ", typeof id);

              await approveUser(id);
              fetchUsers();
              Toast.show({
                type: "success",
                text1: "Member approved successfully",
              });
            } catch (error) {
              console.log("Failed to approve member", error);

              Toast.show({
                type: "error",
                text1: "Failed to approve member",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleBlock = async (id: number) => {
    Alert.alert("Block Member", "Are you sure you want to block this member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            console.log("id is ", id, "type is ", typeof id);

            await blockUser(id);
            fetchUsers();
            Toast.show({
              type: "success",
              text1: "Member blocked successfully",
            });
          } catch (error) {
            console.log("Failed to block member", error);

            Toast.show({
              type: "error",
              text1: "Failed to block member",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // const handleToggleBlock = async (id: number) => {
  //   try {
  //     setLoading(true);
  //     await toggleBlockUser(id);
  //     fetchUsers();
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to update member status");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();

      const sortedMembers = [...data].sort((a, b) => {
        if (a.isBlocked !== b.isBlocked) {
          return a.isBlocked ? 1 : -1;
        }
        return a.id - b.id;
      });

      setMembers(sortedMembers);
      const courseData = await getCourse();
      setCourses(courseData); // Store full course objects
      if (data.length > 0) {
        setExpanded({ [data[0].id]: true });
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const MemberCardSkeleton = ({
    isExpanded,
    isDark,
  }: {
    isExpanded?: boolean;
    isDark: boolean;
  }) => {
    return (
      <View
        style={{
          shadowColor: "#8BC34A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 14,
          backgroundColor: isDark
            ? "rgba(26, 26, 26, 0.3)"
            : "rgba(255, 255, 255, 0.4)",
          borderRadius: 22,
          borderLeftWidth: 6,
          borderLeftColor: "#8BC34A",
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: isDark ? "rgba(139, 195, 74, 0.6)" : "#E0E0E0",
          padding: 12,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={30}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <HStack className="items-center justify-between">
          <HStack className="items-center" style={{ flex: 1 }}>
            <Skeleton
              isDark={isDark}
              width={44}
              height={44}
              borderRadius={22}
              style={{ marginRight: 12 }}
            />
            <VStack style={{ gap: 5 }}>
              <Skeleton
                isDark={isDark}
                width={130}
                height={17}
                borderRadius={6}
              />
              <Skeleton
                isDark={isDark}
                width={80}
                height={11}
                borderRadius={4}
              />
            </VStack>
          </HStack>

          <HStack className="items-center">
            <Skeleton
              isDark={isDark}
              width={62}
              height={22}
              borderRadius={12}
              style={{ marginRight: 8 }}
            />
            <Skeleton
              isDark={isDark}
              width={20}
              height={20}
              borderRadius={10}
            />
          </HStack>
        </HStack>

        {isExpanded && (
          <VStack style={{ marginTop: 16 }}>
            <View
              style={{
                height: 1,
                backgroundColor: isDark ? "#333" : "#f0f0f0",
                marginBottom: 12,
              }}
            />
            <HStack style={{ flexWrap: "wrap", rowGap: 16, columnGap: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <VStack key={i} style={{ width: "47%" }}>
                  <Skeleton
                    isDark={isDark}
                    width={55}
                    height={9}
                    borderRadius={4}
                    style={{ marginBottom: 4 }}
                  />
                  <HStack style={{ alignItems: "center", gap: 5 }}>
                    <Skeleton
                      isDark={isDark}
                      width={14}
                      height={14}
                      borderRadius={7}
                    />
                    <Skeleton
                      isDark={isDark}
                      width={"70%"}
                      height={13}
                      borderRadius={4}
                    />
                  </HStack>
                </VStack>
              ))}
            </HStack>
            <HStack
              style={{ marginTop: 20, justifyContent: "flex-end", gap: 10 }}
            >
              <Skeleton
                isDark={isDark}
                width={76}
                height={36}
                borderRadius={12}
              />
              <Skeleton
                isDark={isDark}
                width={90}
                height={36}
                borderRadius={12}
              />
            </HStack>
          </VStack>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{
        flex: 1,
        backgroundColor: hideAdminControls
          ? "transparent"
          : isDark
            ? "#000"
            : "#f2f2f2",
      }}
    >
      {!hideAdminControls && <Watermark />}

      {/* Header Area */}
      <VStack style={{ paddingTop: 10 }}>
        <HStack className="items-center justify-between px-5 mb-4">
          <VStack>
            <ThemedText
              style={{ fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}
            >
              Members
            </ThemedText>
            <ThemedText style={{ fontSize: 13, opacity: 0.6, marginTop: -2 }}>
              {members.length} total members listed
            </ThemedText>
          </VStack>

          <Pressable
            onPress={() => {
              reset();
              setModalVisible(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#84cc16",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 16,
            }}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <ThemedText
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Add Member
            </ThemedText>
          </Pressable>
        </HStack>

        {/* Search Bar Container */}
        <Box className="px-5 mb-5">
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(30,41,59,0.5)" : "#f1f5f9",
              borderRadius: 18,
              paddingHorizontal: 15,
              height: 50,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "transparent",
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
            <TextInput
              placeholder="Search name, email or ID..."
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 15,
                color: isDark ? "#f8fafc" : "#0f172a",
                fontWeight: "500",
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </Pressable>
            )}
          </Box>
        </Box>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 15 }}
        >
          <HStack style={{ gap: 8 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    borderRadius: 14,
                    backgroundColor: isActive
                      ? "#84cc16"
                      : isDark
                        ? "rgba(30,41,59,0.5)"
                        : "#fff",
                    borderWidth: 1,
                    borderColor: isActive
                      ? "#84cc16"
                      : isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#e2e8f0",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "600",
                      color: isActive ? "#fff" : isDark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {tab}
                  </ThemedText>
                </Pressable>
              );
            })}
          </HStack>
        </ScrollView>
      </VStack>

      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
        >
          <VStack>
            <MemberCardSkeleton isDark={isDark} isExpanded={true} />
            <MemberCardSkeleton isDark={isDark} />
            <MemberCardSkeleton isDark={isDark} />
            <MemberCardSkeleton isDark={isDark} />
          </VStack>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        >
          <VStack className="px-4">
            <VStack space="md" style={{ gap: 16 }}>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <Box
                    key={member.id}
                    style={{
                      backgroundColor: isDark
                        ? "rgba(30, 41, 59, 0.4)"
                        : "rgba(255, 255, 255, 0.8)",
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                      marginBottom: 12,
                      overflow: "hidden",
                      shadowColor: "#000",
                      // shadowOffset: { width: 0, height: 4 },
                      // shadowOpacity: isDark ? 0.3 : 0.05,
                      // shadowRadius: 12,
                      // elevation: 3,
                    }}
                  >
                    <BlurView
                      intensity={isDark ? 40 : 20}
                      tint={isDark ? "dark" : "light"}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Top Indicator Line */}
                    <Box
                      style={{
                        height: 4,
                        backgroundColor: member?.hasPendingSubscriptionRequest
                          ? "#F59E0B"
                          : member.isBlocked
                            ? "#DC2626"
                            : "#22C55E",
                        width: "100%",
                      }}
                    />
                    <Pressable
                      onPress={() => toggleMember(member.id)}
                      style={{ padding: 16 }}
                    >
                      <HStack className="items-center justify-between">
                        <HStack className="items-center" style={{ flex: 1 }}>
                          <Box style={{ position: "relative" }}>
                            <Avatar
                              size="md"
                              style={{
                                borderWidth: 2,
                                borderColor:
                                  member?.hasPendingSubscriptionRequest
                                    ? "#F59E0B"
                                    : member.isBlocked
                                      ? "#DC2626"
                                      : "#22C55E",
                                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                              }}
                            >
                              {member.profilePictureUrl &&
                              member.profilePictureUrl.trim() !== "" &&
                              member.profilePictureUrl !== "null" &&
                              !imageErrors[member.id] ? (
                                <AvatarImage
                                  source={{
                                    uri: member.profilePictureUrl.startsWith(
                                      "http",
                                    )
                                      ? member.profilePictureUrl
                                      : `https://kolve18freeswing.com${member.profilePictureUrl}`,
                                  }}
                                  onError={() =>
                                    setImageErrors((prev) => ({
                                      ...prev,
                                      [member.id]: true,
                                    }))
                                  }
                                />
                              ) : (
                                <ThemedText
                                  style={{
                                    fontWeight: "800",
                                    color: member?.hasPendingSubscriptionRequest
                                      ? "#F59E0B"
                                      : member.isBlocked
                                        ? "#DC2626"
                                        : "#22C55E",
                                    fontSize: 18,
                                  }}
                                >
                                  {member.username.charAt(0).toUpperCase()}
                                </ThemedText>
                              )}
                            </Avatar>
                            <Box
                              style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor:
                                  member?.hasPendingSubscriptionRequest
                                    ? "#F59E0B"
                                    : member.isBlocked
                                      ? "#DC2626"
                                      : "#22C55E",
                                borderWidth: 2,
                                borderColor: isDark ? "#1e293b" : "#fff",
                              }}
                            />
                          </Box>

                          <VStack style={{ marginLeft: 14, flex: 1 }}>
                            <HStack className="items-center" style={{ gap: 8 }}>
                              <ThemedText
                                numberOfLines={1}
                                style={{
                                  fontWeight: "800",
                                  fontSize: 17,
                                  color: isDark ? "#f8fafc" : "#0f172a",
                                }}
                              >
                                {member.username}
                              </ThemedText>
                              <Box
                                style={{
                                  backgroundColor: `${
                                    member?.hasPendingSubscriptionRequest
                                      ? "#F59E0B"
                                      : member.isBlocked
                                        ? "#DC2626"
                                        : "#22C55E"
                                  }15`,
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: `${
                                    member?.hasPendingSubscriptionRequest
                                      ? "#F59E0B"
                                      : member.isBlocked
                                        ? "#DC2626"
                                        : "#22C55E"
                                  }30`,
                                }}
                              >
                                <ThemedText
                                  style={{
                                    color: member?.hasPendingSubscriptionRequest
                                      ? "#F59E0B"
                                      : member.isBlocked
                                        ? "#DC2626"
                                        : "#22C55E",
                                    fontSize: 10,
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {member.subscriptionStatus}
                                </ThemedText>
                              </Box>
                            </HStack>

                            <ThemedText
                              style={{
                                fontSize: 12,
                                color: isDark ? "#94a3b8" : "#64748b",
                                marginTop: 2,
                              }}
                            >
                              ID: #{member.id}{" "}
                              {member.membershipNo || "No Membership No."}
                            </ThemedText>
                          </VStack>
                        </HStack>

                        <Ionicons
                          name={
                            expanded[member.id] ? "chevron-up" : "chevron-down"
                          }
                          size={20}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                      </HStack>

                      {/* Quick Info Bar */}
                      {!expanded[member.id] && (
                        <HStack
                          style={{
                            marginTop: 12,
                            padding: 10,
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.03)"
                              : "rgba(0,0,0,0.02)",
                            borderRadius: 12,
                            gap: 15,
                          }}
                        >
                          <HStack className="items-center" style={{ gap: 5 }}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#84cc16"
                            />
                            <ThemedText style={{ fontSize: 11, opacity: 0.8 }}>
                              {formatDate(member.subscriptionEndsAtUtc) ||
                                "No Active Plan"}
                            </ThemedText>
                          </HStack>
                          {member.activeSubscriptionPlanLabel && (
                            <HStack className="items-center" style={{ gap: 5 }}>
                              <Ionicons
                                name="ribbon-outline"
                                size={14}
                                color="#84cc16"
                              />
                              <ThemedText
                                style={{ fontSize: 11, opacity: 0.8 }}
                              >
                                {member.activeSubscriptionPlanLabel}
                              </ThemedText>
                            </HStack>
                          )}
                        </HStack>
                      )}
                    </Pressable>

                    {expanded[member.id] && (
                      <VStack
                        style={{ paddingHorizontal: 16, paddingBottom: 16 }}
                      >
                        <Divider
                          style={{
                            marginBottom: 16,
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                          }}
                        />
                        <HStack style={{ flexWrap: "wrap", rowGap: 20 }}>
                          {/* Detail Item Grid */}
                          {[
                            {
                              label: "ID",
                              value: member.id.toString(),
                              icon: "finger-print-outline",
                            },
                            {
                              label: "USERNAME",
                              value: member.username,
                              icon: "person-outline",
                            },
                            {
                              label: "EMAIL",
                              value: member.email,
                              icon: "mail-outline",
                            },
                            {
                              label: "MOBILE NUMBER",
                              value: member.mobileNumber,
                              icon: "call-outline",
                            },
                            {
                              label: "ROLE",
                              value: member.role,
                              icon: "shield-checkmark-outline",
                            },
                            {
                              label: "MEMBERSHIP NO.",
                              value: member.membershipNo || "N/A",
                              icon: "card-outline",
                            },
                            {
                              label: "SUBSCRIPTION STATUS",
                              value: member.subscriptionStatus || "N/A",
                              icon: "flash-outline",
                              highlight: member.subscriptionStatus === "Active",
                            },
                            {
                              label: "PENDING REQUEST",
                              value:
                                member.pendingSubscriptionPlanLabel || "N/A",
                              icon: "hourglass-outline",
                            },
                            {
                              label: "REQUESTED ON",
                              value:
                                formatDate(
                                  member.pendingSubscriptionRequestedAtUtc,
                                ) || "N/A",
                              icon: "time-outline",
                            },
                            {
                              label: "ACTIVE PLAN",
                              value:
                                member.activeSubscriptionPlanLabel || "N/A",
                              icon: "ribbon-outline",
                            },
                            {
                              label: "APPROVED ON",
                              value:
                                formatDate(member.subscriptionApprovedAtUtc) ||
                                "N/A",
                              icon: "checkmark-done-outline",
                            },
                            {
                              label: "STARTS ON",
                              value:
                                formatDate(member.subscriptionStartsAtUtc) ||
                                "N/A",
                              icon: "calendar-outline",
                            },
                            {
                              label: "EXPIRES ON",
                              value:
                                formatDate(member.subscriptionEndsAtUtc) ||
                                "N/A",
                              icon: "time-outline",
                            },
                            {
                              label: "DAYS REMAINING",
                              value: member.daysRemaining?.toString() || "0",
                              icon: "calendar-clear-outline",
                            },
                            {
                              label: "HOME COURSE",
                              value: member.homeCourse || "N/A",
                              icon: "map-outline",
                            },
                            {
                              label: "INVITED BY",
                              value:
                                member.invitedBySubAdminName ||
                                "Direct / Admin",
                              icon: "people-outline",
                            },
                            {
                              label: "DECLARED HC",
                              value: member.handicap?.toString() || "0",
                              icon: "analytics-outline",
                            },
                            {
                              label: "HC INDEX",
                              value: member.handicapIndex ?? "N/A",
                              icon: "stats-chart-outline",
                            },
                            {
                              label: "SLOPE",
                              value: member.slope?.toString() || "N/A",
                              icon: "trending-up-outline",
                            },
                            {
                              label: "RATING",
                              value: member.rating?.toString() || "N/A",
                              icon: "star-outline",
                            },
                            {
                              label: `REVISED HC\n(AS ON ${formatDate(new Date().toISOString())})`,
                              value: member.calculatedHandicap ?? "N/A",
                              icon: "analytics-outline",
                              highlight: true,
                            },
                            {
                              label: "DATE OF BIRTH",
                              value: member.dateOfBirth
                                ? formatDate(member.dateOfBirth)
                                : "N/A",
                              icon: "calendar-outline",
                            },
                            {
                              label: `AGE (AS ON ${formatDate(new Date().toISOString())})`,
                              value: member.dateOfBirth
                                ? (() => {
                                    const birthDate = new Date(
                                      member.dateOfBirth,
                                    );
                                    const today = new Date();
                                    let age =
                                      today.getFullYear() -
                                      birthDate.getFullYear();
                                    const m =
                                      today.getMonth() - birthDate.getMonth();
                                    if (
                                      m < 0 ||
                                      (m === 0 &&
                                        today.getDate() < birthDate.getDate())
                                    )
                                      age--;
                                    return age >= 0 ? age : "N/A";
                                  })()
                                : "N/A",
                              icon: "person-outline",
                            },
                          ].map((item, idx) => (
                            <VStack
                              key={idx}
                              style={{ width: "50%", paddingRight: 10 }}
                            >
                              <ThemedText
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: isDark ? "#64748b" : "#94a3b8",
                                  letterSpacing: 0.5,
                                  marginBottom: 4,
                                }}
                              >
                                {item.label}
                              </ThemedText>
                              <HStack
                                className="items-center"
                                style={{ gap: 6 }}
                              >
                                <Ionicons
                                  name={item.icon as any}
                                  size={14}
                                  color={item.highlight ? "#84cc16" : "#94a3b8"}
                                />
                                <ThemedText
                                  numberOfLines={1}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: item.highlight ? "700" : "600",
                                    color: item.highlight
                                      ? "#84cc16"
                                      : isDark
                                        ? "#e2e8f0"
                                        : "#1e293b",
                                  }}
                                >
                                  {item.value}
                                </ThemedText>
                              </HStack>
                            </VStack>
                          ))}
                        </HStack>
                        {!hideAdminControls && (
                          <HStack
                            style={{
                              marginTop: 24,
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            {member?.hasPendingSubscriptionRequest ? (
                              <>
                                <Pressable
                                  onPress={() => handlePlanApprove(member.id)}
                                  style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#84cc16",
                                    paddingVertical: 12,
                                    borderRadius: 14,
                                  }}
                                >
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color="#fff"
                                  />
                                  <ThemedText
                                    style={{
                                      color: "#fff",
                                      fontWeight: "700",
                                      marginLeft: 8,
                                    }}
                                  >
                                    Approve Plan
                                  </ThemedText>
                                </Pressable>
                                <Pressable
                                  onPress={() => handlePlanDenay(member.id)}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isDark
                                      ? "rgba(220, 38, 38, 0.2)"
                                      : "rgba(220, 38, 38, 0.1)",
                                    paddingHorizontal: 20,
                                    paddingVertical: 12,
                                    borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: "rgba(220, 38, 38, 0.2)",
                                  }}
                                >
                                  <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color="#DC2626"
                                  />
                                  <ThemedText
                                    style={{
                                      color: "#DC2626",
                                      fontWeight: "700",
                                      marginLeft: 8,
                                    }}
                                  >
                                    Deny
                                  </ThemedText>
                                </Pressable>
                              </>
                            ) : (
                              <>
                                {member.isBlocked ? (
                                  <Pressable
                                    onPress={() => handleApprove(member.id)}
                                    style={{
                                      flex: 1,
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "#84cc16",
                                      paddingVertical: 12,
                                      borderRadius: 14,
                                    }}
                                  >
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={18}
                                      color="#fff"
                                    />
                                    <ThemedText
                                      style={{
                                        color: "#fff",
                                        fontWeight: "700",
                                        marginLeft: 8,
                                      }}
                                    >
                                      Unblock Member
                                    </ThemedText>
                                  </Pressable>
                                ) : (
                                  <Pressable
                                    onPress={() => handleBlock(member.id)}
                                    style={{
                                      flex: 1,
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: isDark
                                        ? "rgba(220, 38, 38, 0.2)"
                                        : "rgba(220, 38, 38, 0.1)",
                                      paddingVertical: 12,
                                      borderRadius: 14,
                                      borderWidth: 1,
                                      borderColor: "rgba(220, 38, 38, 0.2)",
                                    }}
                                  >
                                    <Ionicons
                                      name="ban"
                                      size={18}
                                      color="#DC2626"
                                    />
                                    <ThemedText
                                      style={{
                                        color: "#DC2626",
                                        fontWeight: "700",
                                        marginLeft: 8,
                                      }}
                                    >
                                      Block Member
                                    </ThemedText>
                                  </Pressable>
                                )}
                              </>
                            )}
                          </HStack>
                        )}
                        )
                      </VStack>
                    )}
                  </Box>
                ))
              ) : (
                <VStack
                  className="items-center justify-center"
                  style={{ marginTop: 60, opacity: 0.5 }}
                >
                  <Box
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="search" size={40} color={"#8ddd14ff"} />
                  </Box>
                  <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                    No members found
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      textAlign: "center",
                      marginTop: 4,
                      maxWidth: 250,
                    }}
                  >
                    Try adjusting your search or filters to find what you're
                    looking for.
                  </ThemedText>
                </VStack>
              )}
            </VStack>
          </VStack>

          {/* ─── ADD PLAYER MODAL ─── */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <View style={styles.modalOverlay}>
                {/* Dismiss backdrop */}
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setModalVisible(false)}
                />

                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: colors.modalBg },
                  ]}
                >
                  {/* Modal Header */}
                  <HStack
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <HStack style={{ alignItems: "center", gap: 8 }}>
                      <Ionicons name="person-add" size={22} color={"#84cc16"} />
                      <ThemedText
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                      >
                        Add Member
                      </ThemedText>
                    </HStack>
                    <Pressable onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.subText} />
                    </Pressable>
                  </HStack>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* ── Row: Name + Email ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Name"
                        required
                        error={errors.username?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="username"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="Full name"
                              placeholderTextColor={colors.dimText}
                              value={value}
                              onChangeText={onChange}
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.username
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Email"
                        required
                        error={errors.email?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="email"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="email@example.com"
                              placeholderTextColor={colors.dimText}
                              value={value}
                              onChangeText={onChange}
                              keyboardType="email-address"
                              autoCapitalize="none"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.email
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>
                    </View>

                    {/* ── Row: Password + Membership ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Password"
                        required
                        error={errors.password?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="password"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="Set password"
                              placeholderTextColor={colors.dimText}
                              value={value}
                              onChangeText={onChange}
                              secureTextEntry
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.password
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Membership No."
                        required
                        error={errors.membershipNo?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="membershipNo"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="Membership Number"
                              placeholderTextColor={colors.dimText}
                              value={value}
                              onChangeText={onChange}
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.membershipNo
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>
                    </View>

                    {/* ── Row: Mobile + Date of Birth ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Mobile"
                        required
                        error={errors.mobileNumber?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="mobileNumber"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="Phone number"
                              placeholderTextColor={colors.dimText}
                              value={value}
                              onChangeText={onChange}
                              keyboardType="phone-pad"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.mobileNumber
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Date of Birth"
                        error={errors.dateOfBirth?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="dateOfBirth"
                          render={({ field: { onChange, value } }) => (
                            <>
                              <Pressable
                                onPress={() => setShowDatePicker(true)}
                                style={[
                                  styles.input,
                                  {
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.inputBorder,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  },
                                ]}
                              >
                                <ThemedText
                                  style={{
                                    fontSize: 14,
                                    color: value ? colors.text : colors.dimText,
                                  }}
                                >
                                  {formatDateDisplay(value || "")}
                                </ThemedText>
                                <Ionicons
                                  name="calendar-outline"
                                  size={18}
                                  color={colors.dimText}
                                />
                              </Pressable>

                              {showDatePicker && (
                                <DateTimePicker
                                  value={value ? new Date(value) : new Date()}
                                  mode="date"
                                  display="default"
                                  onChange={(e: any, selectedDate?: Date) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                      onChange(
                                        selectedDate
                                          .toISOString()
                                          .split("T")[0],
                                      );
                                    }
                                  }}
                                />
                              )}
                            </>
                          )}
                        />
                      </FormField>
                    </View>

                    {/* ── Row: Home Course + Tee Box ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Home Course"
                        required
                        error={errors.homeCourseId?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="homeCourseId"
                          render={({ field: { onChange, value } }) => (
                            <Dropdown
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.homeCourseId
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                },
                              ]}
                              placeholderStyle={{
                                color: colors.dimText,
                                fontSize: 14,
                              }}
                              selectedTextStyle={{
                                color: colors.text,
                                fontSize: 14,
                              }}
                              data={courses.map((c: any) => ({
                                label: c.name,
                                value: c.courseId,
                              }))}
                              labelField="label"
                              valueField="value"
                              placeholder="Select Course"
                              value={value}
                              onChange={(item) => {
                                onChange(item.value);
                                setValue("homeCourse", item.label);
                                // Reset Tee Box when course changes
                                setValue("teeBoxId", 0);
                                setValue("courseSlope", 0);
                                setValue("courseRating", 0);
                                setSelectedCourse(item.value);
                              }}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Tee Box"
                        required
                        error={errors.teeBoxId?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="teeBoxId"
                          render={({ field: { onChange, value } }) => (
                            <Dropdown
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: errors.teeBoxId
                                    ? "#ef4444"
                                    : colors.inputBorder,
                                },
                              ]}
                              placeholderStyle={{
                                color: colors.dimText,
                                fontSize: 14,
                              }}
                              selectedTextStyle={{
                                color: colors.text,
                                fontSize: 14,
                              }}
                              data={
                                courses
                                  .find(
                                    (c: any) =>
                                      c.courseId === watch("homeCourseId"),
                                  )
                                  ?.teeBoxes?.map((t: any) => ({
                                    label: `${t.name} (S:${t.slope} R:${t.rating})`,
                                    value: t.teeBoxId,
                                    slope: t.slope,
                                    rating: t.rating,
                                  })) || []
                              }
                              labelField="label"
                              valueField="value"
                              placeholder="Select Tee"
                              value={value || null}
                              onChange={(item) => {
                                onChange(item.value);
                                setValue("courseSlope", item.slope);
                                setValue("courseRating", item.rating);
                              }}
                            />
                          )}
                        />
                      </FormField>
                    </View>

                    {/* ── Row: Handicap + Handicap Index ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Handicap"
                        error={errors.handicap?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="handicap"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="0"
                              placeholderTextColor={colors.dimText}
                              value={value?.toString() || ""}
                              onChangeText={(t) =>
                                onChange(t === "" ? 0 : Number(t))
                              }
                              keyboardType="numeric"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Handicap Index"
                        error={errors.handicapIndex?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="handicapIndex"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="0.0"
                              placeholderTextColor={colors.dimText}
                              value={value?.toString() || ""}
                              onChangeText={(t) =>
                                onChange(t === "" ? 0 : Number(t))
                              }
                              keyboardType="decimal-pad"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>
                    </View>

                    {/* ── Row: Course Slope + Course Rating (Auto-filled) ── */}
                    <View style={styles.formRow}>
                      <FormField
                        label="Course Slope"
                        error={errors.courseSlope?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="courseSlope"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="0"
                              placeholderTextColor={colors.dimText}
                              value={value?.toString() || ""}
                              onChangeText={(t) =>
                                onChange(t === "" ? 0 : Number(t))
                              }
                              keyboardType="numeric"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.disabledBg,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="Course Rating"
                        error={errors.courseRating?.message}
                        halfWidth
                      >
                        <Controller
                          control={control}
                          name="courseRating"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              placeholder="0.0"
                              placeholderTextColor={colors.dimText}
                              value={value?.toString() || ""}
                              onChangeText={(t) =>
                                onChange(t === "" ? 0 : Number(t))
                              }
                              keyboardType="decimal-pad"
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.disabledBg,
                                  borderColor: colors.inputBorder,
                                  color: colors.text,
                                },
                              ]}
                            />
                          )}
                        />
                      </FormField>
                    </View>
                  </ScrollView>

                  {/* ── Buttons (Fixed Footer) ── */}
                  <View
                    style={[
                      styles.modalButtons,
                      {
                        borderTopWidth: 1,
                        borderTopColor: colors.inputBorder,
                        paddingTop: 16,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => setModalVisible(false)}
                      style={styles.cancelBtn}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.subText,
                        }}
                      >
                        Cancel
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={handleSubmit(handleCreate) as any}
                      disabled={submitting}
                      style={styles.submitBtn}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-outline"
                            size={18}
                            color="#fff"
                          />
                          <ThemedText
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: "#fff",
                              marginLeft: 4,
                            }}
                          >
                            Create Member
                          </ThemedText>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    fontSize: 10,
    color: "#999",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingBottom: 4,
  },
  cancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
  },
});

// ── Helpers ──
function FormField({
  label,
  required,
  error,
  children,
  halfWidth,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  halfWidth?: boolean;
}) {
  return (
    <VStack style={{ width: halfWidth ? "48%" : "100%", marginBottom: 12 }}>
      <HStack style={{ marginBottom: 6, gap: 4 }}>
        <ThemedText
          style={{ fontSize: 13, fontWeight: "600", color: "#64748b" }}
        >
          {label}
        </ThemedText>
        {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
      </HStack>
      {children}
      {error && (
        <ThemedText style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>
          {error}
        </ThemedText>
      )}
    </VStack>
  );
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "Select Date";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};
