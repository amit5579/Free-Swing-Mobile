import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { Avatar, AvatarImage } from "@/components/avatar";
import { Skeleton } from "@/components/Skeleton";
import { getUsers, UserListApi } from "@/api/modules/admin/allMembers.api";

interface MembersTabProps {
  searchQuery?: string;
}

const MemberCardSkeleton = ({ isDark }: { isDark: boolean }) => (
  <View
    style={{
      shadowColor: "#8BC34A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 14,
      backgroundColor: isDark
        ? "rgba(15, 23, 42, 0.7)"
        : "rgba(255, 255, 255, 0.7)",
      borderLeftWidth: 6,
      borderLeftColor: "#8BC34A",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: isDark
        ? "rgba(139, 195, 74, 0.35)"
        : "rgba(139, 195, 74, 0.45)",
      borderRadius: 20,
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
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.05)",
          marginVertical: 16,
        }}
      />

      {/* Home Course / HC Index */}
      <HStack
        className="justify-between items-center"
        style={{ marginBottom: 12 }}
      >
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

export default function MembersTab({ searchQuery = "" }: MembersTabProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const fetchUsers = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data = await getUsers();
      const sortedMembers = [...data].sort((a, b) => {
        if (a.isBlocked !== b.isBlocked) {
          return a.isBlocked ? 1 : -1;
        }
        return a.id - b.id;
      });
      setMembers(sortedMembers);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers(members.length === 0);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(false);
    setRefreshing(false);
  }, []);

  const filteredMembers = members.filter((member) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (member.username && member.username.toLowerCase().includes(q)) ||
      (member.email && member.email.toLowerCase().includes(q)) ||
      (member.membershipNo && member.membershipNo.toLowerCase().includes(q)) ||
      member.id.toString().includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {/* Header: Title + Total Count Box */}
      <HStack
        className="items-center justify-between px-1 mb-4"
        style={{ zIndex: 100 }}
      >
        <ThemedText
          style={{ fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}
        >
          Members
        </ThemedText>
        <Box style={{ position: "relative" }}>
          <LinearGradient
            colors={["#8bc34a", "#558b2f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 12,
              shadowColor: "#8bc34a",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <ThemedText
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: "900",
              }}
            >
              Total: {members.length}
            </ThemedText>
          </LinearGradient>
        </Box>
      </HStack>

      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack>
            <MemberCardSkeleton isDark={isDark} />
            <MemberCardSkeleton isDark={isDark} />
            <MemberCardSkeleton isDark={isDark} />
          </VStack>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack space="md" style={{ gap: 16 }}>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <Box
                  key={member.id}
                  style={{
                    shadowColor: "#8BC34A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.35 : 0.1,
                    shadowRadius: 14,
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderLeftWidth: 6,
                    borderLeftColor: "#8BC34A",
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDark
                      ? "rgba(139, 195, 74, 0.35)"
                      : "rgba(139, 195, 74, 0.45)",
                    borderRadius: 20,
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
                                  "http"
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
                                fontWeight: "bold",
                                fontSize: 14,
                              }}
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
                          {member.invitedBySubAdminName
                            ? member.invitedBySubAdminName
                            : "Direct"}
                        </ThemedText>
                      </VStack>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          router.push(
                            `/(drawer)/(user)/(tabs)/dashboard/tabs/${member.id}`
                          );
                        }}
                        style={{ borderRadius: 12 }}
                      >
                        <LinearGradient
                          colors={["#8bc34a", "#558b2f"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 12,
                            alignItems: "center",
                            shadowColor: "#8bc34a",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <ThemedText
                            style={{
                              color: "white",
                              fontWeight: "800",
                              fontSize: 12,
                            }}
                          >
                            View Profile
                          </ThemedText>
                        </LinearGradient>
                      </TouchableOpacity>
                    </HStack>
                  </View>
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
                  <Ionicons name="search" size={40} color={"#8bc34a"} />
                </Box>
                <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                  {searchQuery
                    ? "No matching members found"
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
                    : "There are no members listed at this time."}
                </ThemedText>
              </VStack>
            )}
          </VStack>
        </ScrollView>
      )}
    </View>
  );
}
