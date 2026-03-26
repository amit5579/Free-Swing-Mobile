import React, { useState, useCallback } from "react";
import {
  Pressable,
  useColorScheme,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
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
        if (a.isApproved !== b.isApproved) {
          return a.isApproved ? 1 : -1;
        }
        return b.id - a.id;
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

  const MemberCardSkelton = ({ isExpanded, isDark }: { isExpanded?: boolean; isDark: boolean }) => {
    return (
      <View style={{ marginBottom: 16 }}>
        <Skeleton isDark={isDark} width={"100%"} height={80} />
        {isExpanded && (
          <View style={{ marginTop: 10 }}>
            <Skeleton isDark={isDark} width={"100%"} height={120} />
          </View>
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
          {[1, 2, 3, 4, 5].map((i) => (
            <MemberCardSkelton
              key={i}
              isExpanded={i === 1}
              isDark={isDark}
            />))}
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

            <Box
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: "rgba(34,197,94,0.15)",
              }}
            >
              <Ionicons name="people-outline" size={16} color="#22c55e" />

              <ThemedText
                style={{
                  color: "#22c55e",
                  fontWeight: "700",
                  marginLeft: 6,
                  fontSize: 14,
                }}
              >
                {members.length} Members
              </ThemedText>
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
                        ? "rgba(26, 26, 26, 0.4)"
                        : "rgba(255, 255, 255, 0.35)",
                      borderRadius: 20,
                      borderLeftWidth: 6,
                      borderLeftColor: !member.isApproved
                        ? "#8BC34A"
                        : (member.isBlocked ? "#EF4444" : "#8BC34A"),
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
                              borderColor: !member.isApproved
                                ? "#8BC34A"
                                : (!member.isBlocked ? "#8BC34A" : "#EF4444"),
                              backgroundColor: !member.isApproved
                                ? "rgba(255,179,0,0.1)"
                                : (!member.isBlocked ? "rgba(139,195,74,0.1)" : "rgba(239,68,68,0.1)"),
                              marginRight: 12,
                            }}
                          >
                            {!member.profilePictureUrl ? (
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: !member.isApproved
                                    ? "#8BC34A"
                                    : (!member.isBlocked ? "#8BC34A" : "#EF4444"),
                                }}
                              >
                                {member.username.charAt(0).toUpperCase()}
                              </ThemedText>
                            ) : (
                              <AvatarImage
                                source={{
                                  uri: `https://kolve18freeswing.com${member.profilePictureUrl}`,
                                }}
                              />
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
                              backgroundColor: !member.isApproved
                                ? "rgba(255,179,0,0.1)"
                                : (!member.isBlocked ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"),
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 12,
                              marginRight: 8,
                            }}
                          >
                            <ThemedText
                              style={{
                                color: !member.isApproved
                                  ? "#8BC34A"
                                  : (!member.isBlocked ? "#22C55E" : "#EF4444"),
                                fontSize: 11,
                                fontWeight: "800",
                              }}
                            >
                              {!member.isApproved ? "PENDING" : (!member.isBlocked ? "ACTIVE" : "BLOCKED")}
                            </ThemedText>
                          </Box>
                          <Ionicons
                            name={
                              expanded[member.id]
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color={!member.isApproved ? "#8BC34A" : (member.isBlocked ? "#EF4444" : "#8BC34A")}
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

                        <HStack style={{ flexWrap: "wrap", gap: 16 }}>
                          <VStack style={{ width: "47%" }}>
                            <ThemedText
                              style={{
                                fontSize: 10,
                                color: "#999",
                                fontWeight: "700",
                                marginBottom: 4,
                              }}
                            >
                              EMAIL
                            </ThemedText>
                            <HStack className="items-center">
                              <Ionicons
                                name="mail-outline"
                                size={14}
                                color={!member.isApproved ? "#8BC34A" : "#8BC34A"}
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 13,
                                  fontWeight: "500",
                                }}
                                numberOfLines={1}
                              >
                                {member.email}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText
                              style={{
                                fontSize: 10,
                                color: "#999",
                                fontWeight: "700",
                                marginBottom: 4,
                              }}
                            >
                              MOBILE
                            </ThemedText>
                            <HStack className="items-center">
                              <Ionicons
                                name="call-outline"
                                size={14}
                                color={!member.isApproved ? "#8BC34A" : "#8BC34A"}
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 13,
                                  fontWeight: "500",
                                }}
                              >
                                {member.mobileNumber}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText
                              style={{
                                fontSize: 10,
                                color: "#999",
                                fontWeight: "700",
                                marginBottom: 4,
                              }}
                            >
                              INVITED BY
                            </ThemedText>
                            <HStack className="items-center">
                              <Ionicons
                                name="people-outline"
                                size={14}
                                color={!member.isApproved ? "#8BC34A" : "#8BC34A"}
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 13,
                                  fontWeight: "600",
                                }}
                              >
                                {!member.invitedBySubAdminName ? (
                                  "Direct"
                                ) : member.invitedBySubAdminName.toLowerCase() ===
                                  "asc aepta" ? (
                                  <ThemedText
                                    style={{
                                      color: !member.isApproved ? "#8BC34A" : "#8BC34A",
                                      fontWeight: "800",
                                    }}
                                  >
                                    Asc Aepta
                                  </ThemedText>
                                ) : (
                                  member.invitedBySubAdminName
                                )}
                              </ThemedText>
                            </HStack>
                          </VStack>

                          <VStack style={{ width: "47%" }}>
                            <ThemedText
                              style={{
                                fontSize: 10,
                                color: "#999",
                                fontWeight: "700",
                                marginBottom: 4,
                              }}
                            >
                              HANDICAP INDEX
                            </ThemedText>
                            <HStack className="items-center">
                              <Ionicons
                                name="ribbon-outline"
                                size={14}
                                color="#8BC34A"
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 15,
                                  fontWeight: "800",
                                  color: "#8BC34A",
                                }}
                              >
                                {member.handicap}
                              </ThemedText>
                            </HStack>
                          </VStack>
                        </HStack>

                        <HStack
                          style={{ marginTop: 24, justifyContent: "flex-end", gap: 12 }}
                        >
                          {!member.isApproved ? (
                            <>
                              {/* <TouchableOpacity
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
                              </TouchableOpacity> */}

                              {/* <TouchableOpacity
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
                              </TouchableOpacity> */}

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
                                // onPress={() => handleDeny(member.id)}
                              >
                                <Ionicons name="ban-outline" size={16} color="#EF4444" />
                                <ThemedText style={{ marginLeft: 6, fontSize: 13, fontWeight: "800", color: "#EF4444" }}>
                                  Block
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
