import React, { useState, useCallback } from "react";
import {
  Pressable,
  useColorScheme,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
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
// import { getUsers, UserListApi } from "@/api/admin/allMembers";
import {
  getUsers,
  approveUser,
  denyUser,
  toggleBlockUser,
  UserListApi
} from "@/api/admin/allMembers";
import { Skeleton } from "@/components/Skeleton";

export default function AllMembersPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();

      // Sort: Pending (!isApproved) members first, then by ID descending (newest first)
      const sortedMembers = [...data].sort((a, b) => {
        // Pending (isBlocked: true) members at the BOTTOM (requested: "new user at the last")
        if (a.isBlocked !== b.isBlocked) {
          return a.isBlocked ? 1 : -1;
        }
        return a.id - b.id; // Sorted by ID ascending
      });

      setMembers(sortedMembers);

      // Auto-expand first item if it exists
      if (sortedMembers.length > 0) {
        setExpanded({ [sortedMembers[0].id]: true });
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

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
          }
        }
      ]
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

  const toggleMember = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const MemberCardSkeleton = ({ isExpanded, isDark }: { isExpanded?: boolean; isDark: boolean }) => {
    return (
      <View
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          borderRadius: 20,
          borderLeftWidth: 6,
          borderLeftColor: isDark ? "#333" : "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center" style={{ flex: 1 }}>
            {/* Avatar skeleton */}
            <Skeleton isDark={isDark} width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
            <VStack space="xs" style={{ gap: 4 }}>
              <Skeleton isDark={isDark} width={100} height={18} />
              <Skeleton isDark={isDark} width={70} height={12} />
            </VStack>
          </HStack>
          {/* Badge & arrow skeleton */}
          <HStack className="items-center">
            <Skeleton isDark={isDark} width={60} height={22} borderRadius={12} style={{ marginRight: 8 }} />
            <Skeleton isDark={isDark} width={20} height={20} borderRadius={10} />
          </HStack>
        </HStack>

        {isExpanded && (
          <VStack style={{ marginTop: 20 }}>
            <View style={{ height: 1.5, backgroundColor: isDark ? "#333" : "#f0f0f0", marginBottom: 16 }} />
            <HStack style={{ flexWrap: "wrap", gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <VStack key={i} style={{ width: "47%" }}>
                  <Skeleton isDark={isDark} width={50} height={10} style={{ marginBottom: 4 }} />
                  <Skeleton isDark={isDark} width={"80%"} height={14} />
                </VStack>
              ))}
            </HStack>
            <HStack style={{ marginTop: 24, justifyContent: "flex-end", gap: 12 }}>
              <Skeleton isDark={isDark} width={80} height={36} borderRadius={12} />
              <Skeleton isDark={isDark} width={80} height={36} borderRadius={12} />
            </HStack>
          </VStack>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      {loading ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
          <HStack className="items-center justify-between mb-8">
            <Skeleton isDark={isDark} width={120} height={24} />
            <Skeleton isDark={isDark} width={100} height={32} borderRadius={12} />
          </HStack>
          <VStack className="px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <MemberCardSkeleton
                key={i}
                isExpanded={i === 1}
                isDark={isDark}
              />
            ))}
          </VStack>
        </View>
      ) : (
        <>
          <HStack className="items-center justify-between mb-6 px-4">
            <HStack className="items-center">
              <Pressable onPress={() => router.back()}>
                <Ionicons
                  name="arrow-back-outline"
                  size={24}
                  color={isDark ? "#fff" : "#020617"}
                />
              </Pressable>

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
                  backgroundColor: "rgba(139,195,74,0.15)", 
                }}
              >
                <Ionicons name="people-outline" size={16} color="#8BC34A" />

                <ThemedText
                  style={{
                    color: "#8BC34A",
                    fontWeight: "700",
                    marginLeft: 6,
                    fontSize: 14,
                    includeFontPadding: false, // ✅ fixes vertical alignment
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
                {members.map((member) => (
                  <Box
                    key={member.id}
                    style={{
                      backgroundColor: isDark
                        ? "rgba(26, 26, 26, 0.6)"
                        : "rgba(255, 255, 255, 0.8)",
                      borderRadius: 20,
                      borderLeftWidth: 6,
                      borderLeftColor: !member.isApproved
                        ? "#8BC34A" // Pending: Light Green
                        : (member.isBlocked ? "#EF4444" : "#8BC34A"), // Blocked: Red, Active: Light Green
                      borderTopWidth: isDark ? 1.5 : 0,
                      borderRightWidth: isDark ? 1.5 : 0,
                      borderBottomWidth: isDark ? 1.5 : 0,
                      borderColor: isDark
                        ? (!member.isApproved
                          ? "#8BC34A"
                          : (member.isBlocked ? "#EF4444" : "#8BC34A"))
                        : "transparent",
                      padding: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.08,
                      shadowRadius: 10,
                      elevation: 4,
                      overflow: "hidden",
                    }}
                  >
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
                            {member.profilePictureUrl && member.profilePictureUrl.trim() !== "" && member.profilePictureUrl !== "null" && !imageErrors[member.id] ? (
                              <AvatarImage
                                source={{
                                  uri: member.profilePictureUrl.startsWith('http') ? member.profilePictureUrl : `https://kolve18freeswing.com${member.profilePictureUrl}`,
                                }}
                                onError={() => setImageErrors(prev => ({ ...prev, [member.id]: true }))}
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
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(139,195,74,0.15)",
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                              marginRight: 8,
                            }}
                          >
                            <ThemedText
                              style={{
                                color: member.isBlocked ? "#EF4444" : "#8BC34A",
                                fontSize: 10,
                                fontWeight: "900",
                                letterSpacing: 0.5,
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
                            size={20}
                            color={member.isBlocked ? "#EF4444" : "#8BC34A"}
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

                        <HStack style={{ flexWrap: "wrap", rowGap: 16, columnGap: 8 }}>
                          {/* Row 1: Contact Info */}
                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>EMAIL</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="mail-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue} numberOfLines={1}>{member.email}</ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>MOBILE</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="call-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>{member.mobileNumber}</ThemedText>
                            </HStack>
                          </VStack>

                          {/* Row 2: Basic Info */}
                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>ROLE</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="person-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>{member.role}</ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>INVITED BY</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="people-outline" size={14} color="#8BC34A" />
                              <ThemedText style={[styles.cardValue, { fontWeight: "700" }]}>
                                {member.invitedBySubAdminName || "Direct"}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          {/* Row 3: Course Info */}
                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>HOME COURSE</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="map-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>{member.homeCourse || "N/A"}</ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>SLOPE / RATING</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="stats-chart-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>
                                {member.slope || "N/A"} / {member.rating || "N/A"}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          {/* Row 4: Handicap Info */}
                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>DECLARED HC / INDEX</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="ribbon-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>
                                {member.handicap} / {member.handicapIndex ?? "N/A"}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>REVISED HC</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="checkmark-done-outline" size={14} color="#8BC34A" />
                              <ThemedText style={[styles.cardValue, { color: "#8BC34A", fontWeight: "800" }]}>
                                {member.calculatedHandicap}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          {/* Row 5: DOB / Age */}
                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>DATE OF BIRTH</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="calendar-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>
                                {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : "N/A"}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText style={styles.cardLabel}>AGE</ThemedText>
                            <HStack className="items-center" style={{ gap: 6 }}>
                              <Ionicons name="hourglass-outline" size={14} color="#8BC34A" />
                              <ThemedText style={styles.cardValue}>
                                {member.dateOfBirth ? (
                                  (() => {
                                    const birthDate = new Date(member.dateOfBirth);
                                    const today = new Date();
                                    let age = today.getFullYear() - birthDate.getFullYear();
                                    const m = today.getMonth() - birthDate.getMonth();
                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                      age--;
                                    }
                                    return age >= 0 ? age : "N/A";
                                  })()
                                ) : "N/A"}
                              </ThemedText>
                            </HStack>
                          </VStack>
                        </HStack>

                        <HStack
                          style={{ marginTop: 24, justifyContent: "flex-end", gap: 12 }}
                        >
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
                                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                                <ThemedText style={{ marginLeft: 6, fontSize: 13, fontWeight: "800", color: "#EF4444" }}>
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
                                <Ionicons name="checkmark-circle-outline" size={16} color="#8BC34A" />
                                <ThemedText style={{ marginLeft: 6, fontSize: 13, fontWeight: "800", color: "#8BC34A" }}>
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
                                color={member.isBlocked ? "#22C55E" : "#EF4444"}
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 13,
                                  fontWeight: "800",
                                  color: member.isBlocked ? "#22C55E" : "#EF4444",
                                }}
                              >
                                {member.isBlocked ? "Unblock" : "Block Member"}
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                        </HStack>
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
