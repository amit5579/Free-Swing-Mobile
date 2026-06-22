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
  TextInput,
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
} from "@/api/modules/admin/allMembers.api";
import { Skeleton } from "@/components/Skeleton";
import { addMemberSchema, AddMemberType } from "@/schema/adminSchemas";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { getCourse } from "@/api/modules/admin/courses.api";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "react-native";

export default function AllMembersScreen({
  hideAdminControls = false,
  searchQuery: initialSearchQuery = "",
}: { hideAdminControls?: boolean; searchQuery?: string } = {}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All"); // All, Pending, Active, Blocked

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

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
    if (activeTab === "Blocked")
      return (
        matchesSearch &&
        member.isBlocked &&
        !member.hasPendingSubscriptionRequest
      );
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
    accent: "#8bc34a",
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
            // console.log("id is ", id, "type is ", typeof id);

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
      // console.log("members", sortedMembers);
      const courseData = await getCourse();
      setCourses(courseData);
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
    hideAdminControls = false,
  }: {
    isExpanded?: boolean;
    isDark: boolean;
    hideAdminControls?: boolean;
  }) => {
    if (hideAdminControls) {
      return (
        <View
          style={{
            shadowColor: "#8BC34A",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 14,
            backgroundColor: isDark
              ? "rgba(26, 26, 26, 0.6)"
              : "rgba(255, 255, 255, 0.6)",
            borderLeftWidth: 6,
            borderLeftColor: "#8BC34A",
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: isDark ? "rgba(139,195,74,0.6)" : "#E0E0E0",
            borderRadius: 22,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ padding: 16 }}>
            {/* Header: avatar + name/role */}
            <HStack className="items-center" space="md">
              <Skeleton isDark={isDark} width={38} height={38} borderRadius={36} />
              <VStack style={{ gap: 5 }}>
                <Skeleton isDark={isDark} width={130} height={16} borderRadius={6} />
                <Skeleton isDark={isDark} width={70} height={10} borderRadius={4} />
              </VStack>
            </HStack>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                marginVertical: 16,
              }}
            />

            {/* Home Course / HC Index */}
            <HStack className="justify-between items-center" style={{ marginBottom: 12 }}>
              <VStack style={{ flex: 1, gap: 4 }}>
                <Skeleton isDark={isDark} width={70} height={10} borderRadius={4} />
                <Skeleton isDark={isDark} width={110} height={13} borderRadius={4} />
              </VStack>
              <VStack style={{ alignItems: "flex-end", gap: 4 }}>
                <Skeleton isDark={isDark} width={50} height={10} borderRadius={4} />
                <Skeleton isDark={isDark} width={35} height={13} borderRadius={4} />
              </VStack>
            </HStack>

            {/* Added By / View Profile button */}
            <HStack className="justify-between items-center">
              <VStack style={{ flex: 1, gap: 4 }}>
                <Skeleton isDark={isDark} width={55} height={10} borderRadius={4} />
                <Skeleton isDark={isDark} width={100} height={13} borderRadius={4} />
              </VStack>
              <Skeleton isDark={isDark} width={96} height={38} borderRadius={12} />
            </HStack>
          </View>
        </View>
      );
    }
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
          padding: 16,
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

        {(isExpanded || hideAdminControls) && (
          <VStack style={{ marginTop: 16 }}>
            <View
              style={{
                height: 1,
                backgroundColor: isDark ? "#333" : "#f0f0f0",
                marginBottom: 12,
              }}
            />
            
            <HStack style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <VStack style={{ flex: 1 }}>
                    <Skeleton isDark={isDark} width={70} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton isDark={isDark} width={100} height={14} />
                </VStack>
                <VStack style={{ alignItems: "flex-end" }}>
                    <Skeleton isDark={isDark} width={50} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton isDark={isDark} width={40} height={14} />
                </VStack>
            </HStack>

            <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                <VStack style={{ flex: 1 }}>
                    <Skeleton isDark={isDark} width={60} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton isDark={isDark} width={90} height={14} />
                </VStack>
                <Skeleton isDark={isDark} width={100} height={36} borderRadius={12} />
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

      <VStack style={{ paddingTop: 10 }}>
        {!hideAdminControls && (
          <HStack className="items-center justify-between px-5 mb-4">
            <VStack>
              <ThemedText
                style={{ fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}
              >
                Members
              </ThemedText>
              <ThemedText style={{ fontSize: 13, opacity: 0.6, marginTop: -2 }}>
                Total Members: {members.length}
              </ThemedText>
            </VStack>

            <Pressable
              onPress={() => {
                router.push("/(drawer)/(admin)/(tabs)/allMembers/addMember");
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#8BC34A",
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
        )}

        {!hideAdminControls && (
          <Box className="px-5 mb-5">
            <Box
              className="flex-row items-center px-4 rounded-xl border h-11"
              style={{
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
        )}

        {hideAdminControls && (
          <HStack
            className="items-center justify-between px-5 mb-4"
            style={{ zIndex: 100 }}
          >
            <ThemedText
              style={{ fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}
            >
              Members
            </ThemedText>
            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  backgroundColor: "#8BC34A",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                  shadowColor: "#8BC34A",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <ThemedText
                  style={{ fontSize: 12, fontWeight: "900" }}
                >
                  Total: {members.length}
                </ThemedText>
              </Box>
              {/* {members.filter((m) => m.hasPendingSubscriptionRequest).length >
                0 && (
                <Box
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "#ef4444",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: isDark ? "#000" : "#fff",
                  }}
                >
                  <ThemedText
                    style={{ color: "white", fontSize: 10, fontWeight: "900" }}
                  >
                    {
                      members.filter((m) => m.hasPendingSubscriptionRequest)
                        .length
                    }
                  </ThemedText>
                </Box>
              )} */}
            </Box>
          </HStack>
        )}

        {!hideAdminControls && (
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
                      paddingHorizontal: 16,
                      height: 36,
                      justifyContent: "center",
                      borderRadius: 999,
                      backgroundColor: isActive
                        ? "#8BC34A"
                        : isDark
                          ? "rgba(30,41,59,0.5)"
                          : "#fff",
                      borderWidth: 1,
                      borderColor: isActive
                        ? "#8BC34A"
                        : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "#e2e8f0",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? "800" : "600",
                        color: isActive
                          ? "#111"
                          : isDark
                            ? "#94a3b8"
                            : "#64748b",
                      }}
                    >
                      {tab}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </HStack>
          </ScrollView>
        )}
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
            <MemberCardSkeleton
              isDark={isDark}
              isExpanded={!hideAdminControls}
              hideAdminControls={hideAdminControls}
            />
            <MemberCardSkeleton
              isDark={isDark}
              hideAdminControls={hideAdminControls}
            />
            <MemberCardSkeleton
              isDark={isDark}
              hideAdminControls={hideAdminControls}
            />
            <MemberCardSkeleton
              isDark={isDark}
              hideAdminControls={hideAdminControls}
            />
          </VStack>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        >
          <VStack className={hideAdminControls ? "px-2" : "px-2"}>
            <VStack space="md" style={{ gap: 16 }}>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  if (hideAdminControls) {
                    return (
                      <Box
                        key={member.id}
                        style={{
                          shadowColor: "#8BC34A",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: isDark ? 0.4 : 0.15,
                          shadowRadius: 14,
                          backgroundColor: isDark
                            ? "rgba(26, 26, 26, 0.6)"
                            : "rgba(255, 255, 255, 0.6)",
                          borderLeftWidth: 6,
                          borderLeftColor: "#8BC34A",
                          borderTopWidth: 1,
                          borderRightWidth: 1,
                          borderBottomWidth: 1,
                          borderColor: isDark
                            ? "rgba(139, 195, 74, 0.6)"
                            : "#E0E0E0",
                          borderRadius: 22,
                          marginBottom: 16,
                          overflow: "hidden",
                        }}
                      >
                        <BlurView
                          intensity={isDark ? 40 : 80}
                          tint={isDark ? "dark" : "light"}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={{ padding: 16 }}>
                          <HStack className="items-center" space="md">
                            <Box style={{ position: "relative" }}>
                              <Box
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 36,
                                  borderWidth: 1.5,
                                  borderColor: "#8BC34A",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  overflow: "hidden",
                                  backgroundColor: isDark ? "#222" : "#eee",
                                }}
                              >
                                {member.profilePictureUrl &&
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
                                    style={{ fontWeight: "bold", fontSize: 14 }}
                                  >
                                    {member.username
                                      ? member.username.charAt(0).toUpperCase()
                                      : "?"}
                                  </ThemedText>
                                )}
                              </Box>
                            </Box>
                            <VStack style={{ gap: -1 }}>
                              <ThemedText
                                style={{ fontSize: 18, fontWeight: "900" }}
                                numberOfLines={1}
                              >
                                {member.username}
                              </ThemedText>
                              <HStack
                                space="xs"
                                className="items-center"
                                style={{ opacity: 0.5 }}
                              >
                                <Ionicons
                                  name="person"
                                  size={10}
                                  color={isDark ? "#fff" : "#111"}
                                />
                                <ThemedText
                                  style={{
                                    fontSize: 9.5,
                                    textTransform: "uppercase",
                                    fontWeight: "700",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {member.role || "Member"}
                                </ThemedText>
                              </HStack>
                            </VStack>
                          </HStack>

                          <View
                            style={{
                              height: 1,
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                              marginVertical: 16,
                            }}
                          />

                          <HStack
                            className="justify-between items-center"
                            style={{ marginBottom: 12 }}
                          >
                            <VStack style={{ flex: 1 }}>
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  opacity: 0.6,
                                  fontWeight: "600",
                                }}
                              >
                                HOME COURSE
                              </ThemedText>
                              <ThemedText
                                style={{ fontSize: 13, fontWeight: "700" }}
                              >
                                {member.homeCourse || "Not added yet"}
                              </ThemedText>
                            </VStack>
                            <VStack style={{ alignItems: "flex-end" }}>
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  opacity: 0.6,
                                  fontWeight: "600",
                                }}
                              >
                                HC INDEX
                              </ThemedText>
                              <ThemedText
                                style={{
                                  fontSize: 13,
                                  fontWeight: "800",
                                  color: "#84cc16",
                                }}
                              >
                                {member.handicapIndex ?? "NA"}
                              </ThemedText>
                            </VStack>
                          </HStack>

                          <HStack className="justify-between items-center">
                            <VStack style={{ flex: 1 }}>
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  opacity: 0.6,
                                  fontWeight: "600",
                                }}
                              >
                                ADDED BY
                              </ThemedText>
                              <ThemedText
                                style={{ fontSize: 13, fontWeight: "700" }}
                              >
                                {member.invitedBySubAdminName ? member.invitedBySubAdminName : "Direct"}
                              </ThemedText>
                            </VStack>
                            <TouchableOpacity
                              onPress={async () => {
                                const role = await AsyncStorage.getItem("role");
                                if (
                                  role?.toLowerCase() === "admin" ||
                                  role?.toLowerCase() === "subadmin"
                                ) {
                                  router.push(
                                    `/(drawer)/(admin)/(tabs)/allMembers/${member.id}`,
                                  );
                                } else {
                                  router.push(
                                    `/(drawer)/(user)/(tabs)/dashboard/tabs/${member.id}`,
                                  );
                                }
                              }}
                              style={{
                                backgroundColor: "#8BC34A",
                                paddingHorizontal: 10,
                                paddingVertical: 7,
                                borderRadius: 12,
                                alignItems: "center",
                                shadowColor: "#8BC34A",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                              }}
                            >
                              <ThemedText
                                style={{
                                  color: "white",
                                  fontWeight: "700",
                                  fontSize: 12,
                                }}
                              >
                                View Profile
                              </ThemedText>
                            </TouchableOpacity>
                          </HStack>
                        </View>
                      </Box>
                    );
                  }
                  return (
                    <Box
                      key={member.id}
                      style={{
                        backgroundColor: isDark
                          ? "rgba(30, 41, 59, 0.4)"
                          : "rgba(255, 255, 255, 0.8)",
                        borderRadius: 24,
                        borderWidth: 1,
                        borderLeftWidth: 6,
                        borderLeftColor: member?.hasPendingSubscriptionRequest
                          ? "#F59E0B"
                          : member.isBlocked
                            ? "#DC2626"
                            : "#8BC34A",
                        borderColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.05)",
                        marginBottom: 16,
                        overflow: "hidden",
                        shadowColor: member?.hasPendingSubscriptionRequest
                          ? "transparent"
                          : member.isBlocked
                            ? "#DC2626"
                            : "#8BC34A",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: member?.hasPendingSubscriptionRequest
                          ? 0
                          : isDark
                            ? 0.3
                            : 0.1,
                        shadowRadius: 12,
                        elevation: member?.hasPendingSubscriptionRequest
                          ? 0
                          : 3,
                      }}
                    >
                      <BlurView
                        intensity={isDark ? 40 : 20}
                        tint={isDark ? "dark" : "light"}
                        style={StyleSheet.absoluteFill}
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
                                        : "#8BC34A",
                                  backgroundColor: isDark
                                    ? "#1e293b"
                                    : "#f1f5f9",
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
                                      color:
                                        member?.hasPendingSubscriptionRequest
                                          ? "#F59E0B"
                                          : member.isBlocked
                                            ? "#DC2626"
                                            : "#8BC34A",
                                      fontSize: 18,
                                    }}
                                  >
                                    {member.username.charAt(0).toUpperCase()}
                                  </ThemedText>
                                )}
                              </Avatar>
                            </Box>

                            <VStack style={{ marginLeft: 14, flex: 1 }}>
                              <HStack
                                className="items-center"
                                style={{ gap: 8 }}
                              >
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
                                          : "#8BC34A"
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
                                          : "#8BC34A"
                                    }30`,
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      color:
                                        member?.hasPendingSubscriptionRequest
                                          ? "#F59E0B"
                                          : member.isBlocked
                                            ? "#DC2626"
                                            : "#8BC34A",
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
                              expanded[member.id]
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color={isDark ? "#94a3b8" : "#64748b"}
                          />
                        </HStack>

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
                                color={member?.hasPendingSubscriptionRequest
                                  ? "#F59E0B"
                                  : member.isBlocked
                                    ? "#DC2626"
                                    : "#8BC34A"}
                              />
                              <ThemedText
                                style={{ fontSize: 11, opacity: 0.8 }}
                              >
                                {formatDate(member.subscriptionEndsAtUtc) ||
                                  "No Active Plan"}
                              </ThemedText>
                            </HStack>
                            {member.activeSubscriptionPlanLabel && (
                              <HStack
                                className="items-center"
                                style={{ gap: 5 }}
                              >
                                <Ionicons
                                  name="ribbon-outline"
                                  size={14}
                                  color={member?.hasPendingSubscriptionRequest
                                    ? "#F59E0B"
                                    : member.isBlocked
                                      ? "#DC2626"
                                      : "#8BC34A"}
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
                            {[
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
                              // {
                              //   label: "SUBSCRIPTION STATUS",
                              //   value: member.subscriptionStatus || "N/A",
                              //   icon: "flash-outline",
                              //   highlight: member.subscriptionStatus === "Active",
                              // },
                              {
                                label: "PENDING",
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
                                  formatDate(
                                    member.subscriptionApprovedAtUtc,
                                  ) || "N/A",
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
                                    color={member?.hasPendingSubscriptionRequest
                                      ? "#F59E0B"
                                      : member.isBlocked
                                        ? "#DC2626"
                                        : "#8BC34A"}
                                  />
                                  <ThemedText
                                    numberOfLines={1}
                                    style={{
                                      fontSize: 13,
                                      fontWeight: item.highlight
                                        ? "700"
                                        : "600",
                                      color: item.highlight
                                        ? "#8bc34a"
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
                                justifyContent: "flex-end",
                                flexWrap: "wrap",
                              }}
                            >
                              {member?.hasPendingSubscriptionRequest ? (
                                <>
                                  <Pressable
                                    onPress={() => handlePlanApprove(member.id)}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "#84cc16",
                                      paddingVertical: 8,
                                      paddingHorizontal: 14,
                                      borderRadius: 14,
                                    }}
                                  >
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={14}
                                      color="#fff"
                                    />
                                    <ThemedText
                                      style={{
                                        color: "#fff",
                                        fontWeight: "700",
                                        fontSize: 12,
                                        marginLeft: 6,
                                      }}
                                    >
                                      Approve
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
                                      paddingHorizontal: 14,
                                      paddingVertical: 8,
                                      borderRadius: 14,
                                      borderWidth: 1,
                                      borderColor: "rgba(220, 38, 38, 0.2)",
                                    }}
                                  >
                                    <Ionicons
                                      name="close-circle"
                                      size={14}
                                      color="#DC2626"
                                    />
                                    <ThemedText
                                      style={{
                                        color: "#DC2626",
                                        fontWeight: "700",
                                        fontSize: 12,
                                        marginLeft: 6,
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
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "#84cc16",
                                        paddingVertical: 8,
                                        paddingHorizontal: 14,
                                        borderRadius: 14,
                                      }}
                                    >
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={14}
                                        color="#fff"
                                      />
                                      <ThemedText
                                        style={{
                                          color: "#fff",
                                          fontWeight: "700",
                                          fontSize: 12,
                                          marginLeft: 6,
                                        }}
                                      >
                                        Unblock
                                      </ThemedText>
                                    </Pressable>
                                  ) : (
                                    <Pressable
                                      onPress={() => handleBlock(member.id)}
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: isDark
                                          ? "rgba(220, 38, 38, 0.2)"
                                          : "rgba(220, 38, 38, 0.1)",
                                        paddingVertical: 8,
                                        paddingHorizontal: 14,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: "rgba(220, 38, 38, 0.2)",
                                      }}
                                    >
                                      <Ionicons
                                        name="ban"
                                        size={14}
                                        color="#DC2626"
                                      />
                                      <ThemedText
                                        style={{
                                          color: "#DC2626",
                                          fontWeight: "700",
                                          fontSize: 12,
                                          marginLeft: 6,
                                        }}
                                      >
                                        Block
                                      </ThemedText>
                                    </Pressable>
                                  )}
                                </>
                              )}
                            </HStack>
                          )}
                        </VStack>
                      )}
                    </Box>
                  );
                })
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
                    <Ionicons name="search" size={40} color={"#8bc34a"} />
                  </Box>
                  <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                    {searchQuery
                      ? "No matching members found"
                      : activeTab === "Pending"
                        ? "No pending members"
                        : activeTab === "Blocked"
                          ? "No blocked members"
                          : activeTab === "Active"
                            ? "No active members"
                            : "No members found"}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      textAlign: "center",
                      marginTop: 4,
                      maxWidth: 250,
                    }}
                  >
                    {searchQuery
                      ? "Try adjusting your search to find what you're looking for."
                      : "There are currently no members in this category."}
                  </ThemedText>
                </VStack>
              )}
            </VStack>
          </VStack>
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
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8BC34A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
  },
});
