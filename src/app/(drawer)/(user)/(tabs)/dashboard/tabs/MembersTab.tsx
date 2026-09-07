import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TextInput,
  Pressable,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { AvatarImage } from "@/components/avatar";
import { Skeleton } from "@/components/Skeleton";
import { getUsers, UserListApi } from "@/api/modules/admin/allMembers.api";
import ENV from "@/config/env";

interface MembersTabProps {
  searchQuery?: string;
}

// Helper to resolve avatar URLs dynamically against backend
const getAvatarUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = ENV.API_BASE_URL || "http://192.168.29.150:5281/api/";
  const origin = base.replace(/\/api\/?$/i, "");
  return `${origin}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

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

  // Search & Filter state
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "handicap" | "blocked" | string
  >("all");
  const [sortBy, setSortBy] = useState<"default" | "nameAsc" | "handicapLow">(
    "default",
  );

  // Sync with searchQuery prop if provided from parent
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

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
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(false);
    setRefreshing(false);
  }, []);

  // Compute unique home courses for dynamic filter chips
  const uniqueHomeCourses = useMemo(() => {
    const courseSet = new Set<string>();
    members.forEach((m) => {
      if (m.homeCourse && m.homeCourse.trim()) {
        courseSet.add(m.homeCourse.trim());
      }
    });
    return Array.from(courseSet).sort();
  }, [members]);

  // Compute counts for filter pills
  const counts = useMemo(() => {
    const active = members.filter((m) => !m.isBlocked).length;
    const withHandicap = members.filter(
      (m) => m.handicapIndex !== null && m.handicapIndex !== undefined,
    ).length;
    const blocked = members.filter((m) => m.isBlocked).length;
    return { active, withHandicap, blocked };
  }, [members]);

  // Filtering and Sorting logic
  const filteredMembers = useMemo(() => {
    let result = members.filter((member) => {
      // 1. Text Search Filter
      const q = localSearch.toLowerCase().trim();
      if (q) {
        const matchName =
          member.username && member.username.toLowerCase().includes(q);
        const matchEmail =
          member.email && member.email.toLowerCase().includes(q);
        const matchCourse =
          member.homeCourse && member.homeCourse.toLowerCase().includes(q);
        const matchMembership =
          member.membershipNo && member.membershipNo.toLowerCase().includes(q);
        const matchRole = member.role && member.role.toLowerCase().includes(q);
        const matchId = member.id.toString().includes(q);
        if (
          !matchName &&
          !matchEmail &&
          !matchCourse &&
          !matchMembership &&
          !matchRole &&
          !matchId
        ) {
          return false;
        }
      }

      // 2. Category / Pill Filter
      if (selectedFilter === "active") {
        if (member.isBlocked) return false;
      } else if (selectedFilter === "handicap") {
        if (member.handicapIndex === null || member.handicapIndex === undefined) {
          return false;
        }
      } else if (selectedFilter === "blocked") {
        if (!member.isBlocked) return false;
      } else if (selectedFilter !== "all") {
        // Course specific filter
        if (!member.homeCourse || member.homeCourse.trim() !== selectedFilter) {
          return false;
        }
      }

      return true;
    });

    // 3. Sorting
    if (sortBy === "nameAsc") {
      result = [...result].sort((a, b) =>
        (a.username || "").localeCompare(b.username || ""),
      );
    } else if (sortBy === "handicapLow") {
      result = [...result].sort((a, b) => {
        const hcA = a.handicapIndex ?? 999;
        const hcB = b.handicapIndex ?? 999;
        return hcA - hcB;
      });
    }

    return result;
  }, [members, localSearch, selectedFilter, sortBy]);

  const hasActiveFilters = localSearch.trim() !== "" || selectedFilter !== "all";

  const clearAllFilters = () => {
    setLocalSearch("");
    setSelectedFilter("all");
    setSortBy("default");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {/* Header: Title + Total Count Badge */}
      <HStack
        className="items-center justify-between px-1 mb-3"
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

      {/* Search Input Bar */}
      <Box
        className="flex-row items-center px-3 mb-3 rounded-xl border h-11"
        style={{
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          shadowColor: "#000",
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: 0.05,
          shadowRadius: 4,
          // elevation: 2,
        }}
      >
        <Ionicons name="search-outline" size={18} color="#8BC34A" />
        <TextInput
          placeholder="Search by name, home course, membership no..."
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          value={localSearch}
          onChangeText={setLocalSearch}
          style={{
            flex: 1,
            marginLeft: 8,
            color: isDark ? "#fff" : "#111",
            fontSize: 14,
            paddingVertical: 5,
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {localSearch !== "" && (
          <Pressable onPress={() => setLocalSearch("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          </Pressable>
        )}
      </Box>

      {/* Quick Filter Chips Horizontal Scroll */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        >
          {/* All Chip */}
          <TouchableOpacity
            onPress={() => setSelectedFilter("all")}
            activeOpacity={0.7}
            style={[
              styles.filterChip,
              selectedFilter === "all" && styles.filterChipActive,
              {
                backgroundColor:
                  selectedFilter === "all"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(15, 23, 42, 0.6)"
                      : "#ffffff",
                borderColor:
                  selectedFilter === "all"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e2e8f0",
              },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={13}
              color={
                selectedFilter === "all"
                  ? "#ffffff"
                  : isDark
                    ? "#94a3b8"
                    : "#64748b"
              }
              style={{ marginRight: 4 }}
            />
            <ThemedText
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === "all"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                  fontWeight: selectedFilter === "all" ? "800" : "600",
                },
              ]}
            >
              All ({members.length})
            </ThemedText>
          </TouchableOpacity>

          {/* Active Chip */}
          <TouchableOpacity
            onPress={() => setSelectedFilter("active")}
            activeOpacity={0.7}
            style={[
              styles.filterChip,
              selectedFilter === "active" && styles.filterChipActive,
              {
                backgroundColor:
                  selectedFilter === "active"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(15, 23, 42, 0.6)"
                      : "#ffffff",
                borderColor:
                  selectedFilter === "active"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e2e8f0",
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={13}
              color={
                selectedFilter === "active"
                  ? "#ffffff"
                  : isDark
                    ? "#94a3b8"
                    : "#64748b"
              }
              style={{ marginRight: 4 }}
            />
            <ThemedText
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === "active"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                  fontWeight: selectedFilter === "active" ? "800" : "600",
                },
              ]}
            >
              Active ({counts.active})
            </ThemedText>
          </TouchableOpacity>

          {/* With Handicap Chip */}
          <TouchableOpacity
            onPress={() => setSelectedFilter("handicap")}
            activeOpacity={0.7}
            style={[
              styles.filterChip,
              selectedFilter === "handicap" && styles.filterChipActive,
              {
                backgroundColor:
                  selectedFilter === "handicap"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(15, 23, 42, 0.6)"
                      : "#ffffff",
                borderColor:
                  selectedFilter === "handicap"
                    ? "#8BC34A"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e2e8f0",
              },
            ]}
          >
            <Ionicons
              name="flag-outline"
              size={13}
              color={
                selectedFilter === "handicap"
                  ? "#ffffff"
                  : isDark
                    ? "#94a3b8"
                    : "#64748b"
              }
              style={{ marginRight: 4 }}
            />
            <ThemedText
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === "handicap"
                      ? "#ffffff"
                      : isDark
                        ? "#cbd5e1"
                        : "#475569",
                  fontWeight: selectedFilter === "handicap" ? "800" : "600",
                },
              ]}
            >
              Handicap ({counts.withHandicap})
            </ThemedText>
          </TouchableOpacity>

          {/* Blocked Chip (if any) */}
          {counts.blocked > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedFilter("blocked")}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                selectedFilter === "blocked" && styles.filterChipActive,
                {
                  backgroundColor:
                    selectedFilter === "blocked"
                      ? "#ef4444"
                      : isDark
                        ? "rgba(15, 23, 42, 0.6)"
                        : "#ffffff",
                  borderColor:
                    selectedFilter === "blocked"
                      ? "#ef4444"
                      : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#e2e8f0",
                },
              ]}
            >
              <Ionicons
                name="ban-outline"
                size={13}
                color={
                  selectedFilter === "blocked"
                    ? "#ffffff"
                    : isDark
                      ? "#94a3b8"
                      : "#64748b"
                }
                style={{ marginRight: 4 }}
              />
              <ThemedText
                style={[
                  styles.filterChipText,
                  {
                    color:
                      selectedFilter === "blocked"
                        ? "#ffffff"
                        : isDark
                          ? "#cbd5e1"
                          : "#475569",
                    fontWeight: selectedFilter === "blocked" ? "800" : "600",
                  },
                ]}
              >
                Blocked ({counts.blocked})
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Dynamic Unique Course Filter Chips */}
          {uniqueHomeCourses.map((course) => {
            const isSelected = selectedFilter === course;
            const courseCount = members.filter(
              (m) => m.homeCourse?.trim() === course,
            ).length;
            return (
              <TouchableOpacity
                key={course}
                onPress={() => setSelectedFilter(course)}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  {
                    backgroundColor: isSelected
                      ? "#8BC34A"
                      : isDark
                        ? "rgba(15, 23, 42, 0.6)"
                        : "#ffffff",
                    borderColor: isSelected
                      ? "#8BC34A"
                      : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#e2e8f0",
                  },
                ]}
              >
                <Ionicons
                  name="golf-outline"
                  size={13}
                  color={
                    isSelected ? "#ffffff" : isDark ? "#94a3b8" : "#64748b"
                  }
                  style={{ marginRight: 4 }}
                />
                <ThemedText
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected
                        ? "#ffffff"
                        : isDark
                          ? "#cbd5e1"
                          : "#475569",
                      fontWeight: isSelected ? "800" : "600",
                    },
                  ]}
                >
                  {course} ({courseCount})
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Status Summary & Sort Bar */}
      <HStack className="items-center justify-between px-1 mb-3">
        <ThemedText
          style={{
            fontSize: 12,
            color: isDark ? "#94a3b8" : "#64748b",
            fontWeight: "600",
          }}
        >
          {hasActiveFilters
            ? `Showing ${filteredMembers.length} of ${members.length} members`
            : `${members.length} members`}
        </ThemedText>

        <HStack space="xs" className="items-center">
          {/* Quick Sort Button */}
          <TouchableOpacity
            onPress={() => {
              if (sortBy === "default") setSortBy("nameAsc");
              else if (sortBy === "nameAsc") setSortBy("handicapLow");
              else setSortBy("default");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
            }}
          >
            <Ionicons
              name="swap-vertical"
              size={13}
              color={sortBy !== "default" ? "#8BC34A" : isDark ? "#94a3b8" : "#64748b"}
            />
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color:
                  sortBy !== "default"
                    ? "#8BC34A"
                    : isDark
                      ? "#94a3b8"
                      : "#64748b",
              }}
            >
              {sortBy === "nameAsc"
                ? "Name A-Z"
                : sortBy === "handicapLow"
                  ? "HC Index"
                  : "Sort"}
            </ThemedText>
          </TouchableOpacity>

          {/* Reset Filters button if active */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearAllFilters}
              style={{
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: isDark
                  ? "rgba(239, 68, 68, 0.15)"
                  : "#fee2e2",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#ef4444",
                }}
              >
                Reset
              </ThemedText>
            </TouchableOpacity>
          )}
        </HStack>
      </HStack>

      {/* Main List */}
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
              filteredMembers.map((member) => {
                const avatarUri = getAvatarUrl(member.profilePictureUrl);
                return (
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
                      borderLeftColor: member.isBlocked ? "#ef4444" : "#8BC34A",
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
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: member.isBlocked
                                ? "#ef4444"
                                : "#8BC34A",
                              justifyContent: "center",
                              alignItems: "center",
                              overflow: "hidden",
                              backgroundColor: isDark ? "#222" : "#eee",
                            }}
                          >
                            {avatarUri && !imageErrors[member.id] ? (
                              <AvatarImage
                                source={{ uri: avatarUri }}
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
                                  fontSize: 15,
                                }}
                              >
                                {member.username
                                  ? member.username.charAt(0).toUpperCase()
                                  : "?"}
                              </ThemedText>
                            )}
                          </Box>
                        </Box>
                        <VStack style={{ flex: 1, gap: 2 }}>
                          <HStack className="items-center justify-between">
                            <ThemedText
                              style={{ fontSize: 17, fontWeight: "900" }}
                              numberOfLines={1}
                            >
                              {member.username}
                            </ThemedText>
                            {member.isBlocked && (
                              <View
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                                }}
                              >
                                <ThemedText
                                  style={{
                                    fontSize: 10,
                                    fontWeight: "800",
                                    color: "#ef4444",
                                  }}
                                >
                                  BLOCKED
                                </ThemedText>
                              </View>
                            )}
                          </HStack>

                          <HStack
                            space="xs"
                            className="items-center"
                            style={{ opacity: 0.6 }}
                          >
                            <Ionicons
                              name="person"
                              size={10}
                              color={isDark ? "#fff" : "#111"}
                            />
                            <ThemedText
                              style={{
                                fontSize: 10,
                                textTransform: "uppercase",
                                fontWeight: "700",
                                letterSpacing: 0.5,
                              }}
                            >
                              {member.role || "Member"}
                            </ThemedText>
                            {member.membershipNo && (
                              <ThemedText style={{ fontSize: 10 }}>
                                &bull; #{member.membershipNo}
                              </ThemedText>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                          marginVertical: 14,
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
                            numberOfLines={1}
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
                              color:
                                member.handicapIndex !== null
                                  ? "#84cc16"
                                  : isDark
                                    ? "#94a3b8"
                                    : "#64748b",
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
                            numberOfLines={1}
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
                              `/(drawer)/(user)/(tabs)/dashboard/tabs/${member.id}`,
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
                );
              })
            ) : (
              <VStack
                className="items-center justify-center"
                style={{ marginTop: 40, paddingHorizontal: 20 }}
              >
                <Box
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="search" size={36} color={"#8bc34a"} />
                </Box>
                <ThemedText style={{ fontSize: 17, fontWeight: "800" }}>
                  {hasActiveFilters
                    ? "No matching members found"
                    : "No members found"}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 13,
                    textAlign: "center",
                    marginTop: 6,
                    color: isDark ? "#94a3b8" : "#64748b",
                    maxWidth: 280,
                    lineHeight: 18,
                  }}
                >
                  {localSearch
                    ? `No members match "${localSearch}". Try checking the spelling or clearing your filters.`
                    : "No members match the selected filter."}
                </ThemedText>

                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={clearAllFilters}
                    style={{
                      marginTop: 16,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#8bc34a", "#558b2f"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#FFF" />
                      <ThemedText
                        style={{
                          color: "#FFF",
                          fontSize: 13,
                          fontWeight: "800",
                        }}
                      >
                        Clear Search & Filters
                      </ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </VStack>
            )}
          </VStack>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
});
