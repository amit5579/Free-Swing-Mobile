import React, { useState, useEffect } from "react";
import {
  Pressable,
  useColorScheme,
  ActivityIndicator,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

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
import { getUsers, UserListApi } from "@/api/admin/allMembers";
import { Skeleton } from "@/components/Skeleton";

export default function AllMembersScreen({
  hideAdminControls = false,
  searchQuery = "",
}: { hideAdminControls?: boolean; searchQuery?: string } = {}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {},
  );

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      setUserRole(storedRole?.toLowerCase() || null);
    };
    loadRole();
    fetchUsers();
  }, []);
  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await approveUser(id);
      Alert.alert("Success", "Member approved successfully");
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to approve member");
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async (id: number) => {
    Alert.alert(
      "Deny Member",
      "Are you sure you want to deny this member? This will remove their request.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await denyUser(id);
              Alert.alert("Success", "Member denied successfully");
              fetchUsers();
            } catch (error) {
              Alert.alert("Error", "Failed to deny member");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleBlock = async (id: number) => {
    try {
      setLoading(true);
      await toggleBlockUser(id);
      fetchUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to update member status");
    } finally {
      setLoading(false);
    }
  };
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

      {loading ? (
        <>
          <HStack className="items-center justify-between mt-4 mb-6 px-4">
            <HStack className="items-center">
              <ThemedText
                style={{ fontSize: 20, fontWeight: "700", marginLeft: 12 }}
              >
                All Members
              </ThemedText>
            </HStack>
          </HStack>
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
        </>
      ) : (
        <>
          <HStack className="items-center justify-between mt-4 mb-6 px-4">
            <HStack className="items-center">
              <ThemedText
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  marginLeft: 12,
                }}
              >
                All Members
              </ThemedText>
            </HStack>

            <Box style={{ position: "relative" }}>
              <Box
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: "rgba(139,195,74,1)",
                }}
              >
                <Ionicons name="people-outline" size={16} color="#fff" />

                <ThemedText
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    marginLeft: 6,
                    fontSize: 14,
                    includeFontPadding: false,
                  }}
                >
                  {members.length} Members
                </ThemedText>
              </Box>

              {members.filter((m) => m.isBlocked).length > 0 && (
                <Box
                  style={{
                    backgroundColor: "#EF4444",
                    minWidth: 22,
                    height: 22,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                    position: "absolute",
                    top: -8,
                    right: -8,
                    borderWidth: 2,
                    borderColor: isDark ? "#000" : "#fff",
                  }}
                >
                  <ThemedText
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "900",
                      textAlign: "center",
                      textAlignVertical: "center",
                      includeFontPadding: false,
                      lineHeight: 12,
                    }}
                  >
                    {members.filter((m) => m.isBlocked).length}
                  </ThemedText>
                </Box>
              )}
            </Box>
          </HStack>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          >
            <VStack className="px-4">
              <VStack space="md" style={{ gap: 16 }}>
                {members
                  .filter((m) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      m.username?.toLowerCase().includes(q) ||
                      m.email?.toLowerCase().includes(q)
                    );
                  })
                  .map((member) => (
                    <Box
                      key={member.id}
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
                        borderLeftColor: member.isBlocked ? "#EF4444" : "#8BC34A",
                        borderTopWidth: 1,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                        borderColor:
                          member.isBlocked && isDark
                            ? "#EF4444"
                            : isDark
                              ? "rgba(139, 195, 74, 0.6)"
                              : "#E0E0E0",
                        padding: 12,
                        marginBottom: 12,
                        overflow: "hidden",
                      }}
                    >
                      <BlurView
                        intensity={25}
                        tint={isDark ? "dark" : "light"}
                        style={StyleSheet.absoluteFill}
                      />
                      <Pressable onPress={() => toggleMember(member.id)}>
                        <HStack className="items-center justify-between">
                          <HStack className="items-center" style={{ flex: 1 }}>
                            <Avatar
                              size="md"
                              style={{
                                borderWidth: 2,
                                borderColor: member.isBlocked
                                  ? "#EF4444"
                                  : "#8BC34A",
                                backgroundColor: member.isBlocked
                                  ? "rgba(239,68,68,0.1)"
                                  : "rgba(139,195,74,0.1)",
                                marginRight: 12,
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
                                    color: member.isBlocked
                                      ? "#EF4444"
                                      : "#8BC34A",
                                  }}
                                >
                                  {member.username.charAt(0).toUpperCase()}
                                </ThemedText>
                              )}
                            </Avatar>
                            <VStack>
                              <ThemedText
                                style={{ fontWeight: "800", fontSize: 17 }}
                              >
                                {member.username}
                              </ThemedText>
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  color: isDark ? "#888" : "#999",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Player ID: #{member.id}
                              </ThemedText>
                            </VStack>
                          </HStack>

                          <HStack className="items-center">
                            <Box
                              style={{
                                backgroundColor: member.isBlocked
                                  ? "rgba(239,68,68,0.12)"
                                  : "rgba(139,195,74,0.12)",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 14,
                                marginRight: 10,
                              }}
                            >
                              <ThemedText
                                style={{
                                  color: member.isBlocked ? "#DC2626" : "#2E7D32",
                                  fontSize: 11,
                                  fontWeight: "600",
                                  letterSpacing: 0.6,
                                }}
                              >
                                {member.isBlocked ? "PENDING" : "ACTIVE"}
                              </ThemedText>
                            </Box>

                            <Ionicons
                              name={
                                expanded[member.id]
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={18}
                              color={member.isBlocked ? "#DC2626" : "#2E7D32"}
                            />
                          </HStack>
                        </HStack>
                      </Pressable>

                      {expanded[member.id] && (
                        <VStack style={{ marginTop: 20 }}>
                          <Divider
                            style={{
                              marginBottom: 16,
                              backgroundColor: isDark ? "#333" : "#F0F0F0",
                            }}
                          />

                          <HStack
                            style={{ flexWrap: "wrap", rowGap: 16, columnGap: 8 }}
                          >
                            {!hideAdminControls && (
                              <>
                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    EMAIL
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="mail-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText
                                      style={[styles.cardValue, { flex: 1 }]}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {member.email}
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    MOBILE
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="call-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText style={styles.cardValue}>
                                      {member.mobileNumber}
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    ROLE
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="person-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText style={styles.cardValue}>
                                      {member.role}
                                    </ThemedText>
                                  </HStack>
                                </VStack>
                              </>
                            )}

                            <VStack style={{ width: "47%" }}>
                              <ThemedText style={styles.cardLabel}>
                                INVITED BY
                              </ThemedText>
                              <HStack className="items-center" style={{ gap: 6 }}>
                                <Ionicons
                                  name="people-outline"
                                  size={14}
                                  color="#8BC34A"
                                />
                                <ThemedText
                                  style={[
                                    styles.cardValue,
                                    { fontWeight: "700" },
                                  ]}
                                >
                                  {member.invitedBySubAdminName || "Direct"}
                                </ThemedText>
                              </HStack>
                            </VStack>

                            <VStack style={{ width: "47%" }}>
                              <ThemedText style={styles.cardLabel}>
                                HOME COURSE
                              </ThemedText>
                              <HStack className="items-center" style={{ gap: 6 }}>
                                <Ionicons
                                  name="map-outline"
                                  size={14}
                                  color="#8BC34A"
                                />
                                <ThemedText style={styles.cardValue}>
                                  {member.homeCourse || "N/A"}
                                </ThemedText>
                              </HStack>
                            </VStack>

                            {!hideAdminControls && (
                              <VStack style={{ width: "47%" }}>
                                <ThemedText style={styles.cardLabel}>
                                  SLOPE / RATING
                                </ThemedText>
                                <HStack
                                  className="items-center"
                                  style={{ gap: 6 }}
                                >
                                  <Ionicons
                                    name="stats-chart-outline"
                                    size={14}
                                    color="#8BC34A"
                                  />
                                  <ThemedText style={styles.cardValue}>
                                    {member.slope || "N/A"} /{" "}
                                    {member.rating || "N/A"}
                                  </ThemedText>
                                </HStack>
                              </VStack>
                            )}

                            <VStack style={{ width: "47%" }}>
                              <ThemedText style={styles.cardLabel}>
                                {hideAdminControls
                                  ? "HC INDEX"
                                  : "DECLARED HC / INDEX"}
                              </ThemedText>
                              <HStack className="items-center" style={{ gap: 6 }}>
                                <Ionicons
                                  name="ribbon-outline"
                                  size={14}
                                  color="#8BC34A"
                                />
                                <ThemedText style={styles.cardValue}>
                                  {hideAdminControls
                                    ? (member.handicapIndex ?? "N/A")
                                    : `${member.handicap} / ${member.handicapIndex ?? "N/A"}`}
                                </ThemedText>
                              </HStack>
                            </VStack>

                            {hideAdminControls && (
                              <VStack
                                style={{
                                  width: "47%",
                                  justifyContent: "center",
                                  alignItems: "flex-end",
                                }}
                              >
                                <TouchableOpacity
                                  style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    backgroundColor: "rgba(139,195,74,0.1)",
                                    borderWidth: 1,
                                    borderColor: "rgba(139,195,74,0.2)",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                  onPress={() => {
                                    const path = userRole === 'admin'
                                      ? "/(drawer)/(admin)/(tabs)/allMembers/[id]"
                                      : "/(drawer)/(user)/(tabs)/dashboard/tabs/[id]";

                                    router.push({
                                      pathname: path as any,
                                      params: { id: member.id },
                                    });
                                  }}
                                >
                                  <Ionicons
                                    name="eye-outline"
                                    size={16}
                                    color="#8BC34A"
                                  />
                                  <ThemedText
                                    style={{
                                      marginLeft: 6,
                                      fontSize: 13,
                                      fontWeight: "800",
                                      color: "#8BC34A",
                                    }}
                                  >
                                    View Profile
                                  </ThemedText>
                                </TouchableOpacity>
                              </VStack>
                            )}

                            {!hideAdminControls && (
                              <>
                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    REVISED HC
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="checkmark-done-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText
                                      style={[
                                        styles.cardValue,
                                        { color: "#8BC34A", fontWeight: "800" },
                                      ]}
                                    >
                                      {member.calculatedHandicap}
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    DATE OF BIRTH
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="calendar-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText style={styles.cardValue}>
                                      {member.dateOfBirth
                                        ? new Date(
                                          member.dateOfBirth,
                                        ).toLocaleDateString()
                                        : "N/A"}
                                    </ThemedText>
                                  </HStack>
                                </VStack>

                                <VStack style={{ width: "47%" }}>
                                  <ThemedText style={styles.cardLabel}>
                                    AGE
                                  </ThemedText>
                                  <HStack
                                    className="items-center"
                                    style={{ gap: 6 }}
                                  >
                                    <Ionicons
                                      name="hourglass-outline"
                                      size={14}
                                      color="#8BC34A"
                                    />
                                    <ThemedText style={styles.cardValue}>
                                      {member.dateOfBirth
                                        ? (() => {
                                          const birthDate = new Date(
                                            member.dateOfBirth,
                                          );
                                          const today = new Date();
                                          let age =
                                            today.getFullYear() -
                                            birthDate.getFullYear();
                                          const m =
                                            today.getMonth() -
                                            birthDate.getMonth();
                                          if (
                                            m < 0 ||
                                            (m === 0 &&
                                              today.getDate() <
                                              birthDate.getDate())
                                          ) {
                                            age--;
                                          }
                                          return age >= 0 ? age : "N/A";
                                        })()
                                        : "N/A"}
                                    </ThemedText>
                                  </HStack>
                                </VStack>
                              </>
                            )}
                          </HStack>

                          {!hideAdminControls && (
                            <HStack
                              style={{
                                marginTop: 24,
                                justifyContent: "flex-end",
                                gap: 12,
                              }}
                            >
                              <>
                                {member.isBlocked ? (
                                  <>
                                    <TouchableOpacity
                                      style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        backgroundColor: "rgba(239,68,68,0.1)",
                                        borderWidth: 1,
                                        borderColor: "rgba(239,68,68,0.2)",
                                        flexDirection: "row",
                                        alignItems: "center",
                                      }}
                                      onPress={() => handleDeny(member.id)}
                                    >
                                      <Ionicons
                                        name="close-circle-outline"
                                        size={16}
                                        color="#EF4444"
                                      />
                                      <ThemedText
                                        style={{
                                          marginLeft: 6,
                                          fontSize: 13,
                                          fontWeight: "800",
                                          color: "#EF4444",
                                        }}
                                      >
                                        Deny
                                      </ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        backgroundColor: "rgba(139,195,74,0.15)",
                                        borderWidth: 1,
                                        borderColor: "rgba(139,195,74,0.2)",
                                        flexDirection: "row",
                                        alignItems: "center",
                                      }}
                                      onPress={() => handleApprove(member.id)}
                                    >
                                      <Ionicons
                                        name="checkmark-circle-outline"
                                        size={16}
                                        color="#8BC34A"
                                      />
                                      <ThemedText
                                        style={{
                                          marginLeft: 6,
                                          fontSize: 13,
                                          fontWeight: "800",
                                          color: "#8BC34A",
                                        }}
                                      >
                                        Approve
                                      </ThemedText>
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <TouchableOpacity
                                    style={{
                                      paddingHorizontal: 20,
                                      paddingVertical: 10,
                                      borderRadius: 12,
                                      backgroundColor: member.isBlocked
                                        ? "rgba(34,197,94,0.1)"
                                        : "rgba(239,68,68,0.15)",
                                      borderWidth: 1,
                                      borderColor: member.isBlocked
                                        ? "rgba(34,197,94,0.2)"
                                        : "rgba(239,68,68,0.2)",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    }}
                                    onPress={() => handleToggleBlock(member.id)}
                                  >
                                    <Ionicons
                                      name={
                                        member.isBlocked
                                          ? "checkmark-circle-outline"
                                          : "ban-outline"
                                      }
                                      size={16}
                                      color={
                                        member.isBlocked ? "#22C55E" : "#EF4444"
                                      }
                                    />
                                    <ThemedText
                                      style={{
                                        marginLeft: 6,
                                        fontSize: 13,
                                        fontWeight: "800",
                                        color: member.isBlocked
                                          ? "#22C55E"
                                          : "#EF4444",
                                      }}
                                    >
                                      {member.isBlocked
                                        ? "Unblock"
                                        : "Block Member"}
                                    </ThemedText>
                                  </TouchableOpacity>
                                )}
                              </>
                            </HStack>
                          )}
                        </VStack>
                      )}
                    </Box>
                  ))}
              </VStack>
            </VStack>
          </ScrollView>
        </>
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
});
function approveUser(id: number) {
  throw new Error("Function not implemented.");
}

function denyUser(id: number) {
  throw new Error("Function not implemented.");
}

function toggleBlockUser(id: number) {
  throw new Error("Function not implemented.");
}
