import React, { useState, useEffect } from "react";
import {
  Pressable,
  useColorScheme,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
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
import { getUsers, UserListApi } from "@/api/admin/allMembers";

export default function AllMembersPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [members, setMembers] = useState<UserListApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setMembers(data);

      // Auto-expand first item if it exists
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

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      {/* WATERMARK */}
      <Watermark />

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#8bc34a" />
          <ThemedText style={{ marginTop: 12, color: "#8bc34a" }}>
            Loading members...
          </ThemedText>
        </View>
      ) : (
        <>
          {/* HEADER */}
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

            {/* MEMBERS COUNT */}
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
              {/* MEMBERS LIST */}
              <VStack space="md" style={{ gap: 16 }}>
                {members.map((member) => (
                  <Box
                    key={member.id}
                    style={{
                      backgroundColor: isDark
                        ? "rgba(26,26,26,0.85)"
                        : "rgba(255,255,255,0.85)",
                      borderRadius: 20,
                      borderLeftWidth: 6,
                      borderLeftColor: member.isBlocked ? "#EF4444" : "#8BC34A",
                      padding: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.08,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                  >
                    {/* MEMBER HEADER */}
                    <Pressable onPress={() => toggleMember(member.id)}>
                      <HStack className="items-center justify-between">
                        <HStack className="items-center" style={{ flex: 1 }}>
                          <Avatar
                            size="md"
                            style={{
                              borderWidth: 2,
                              borderColor: !member.isBlocked
                                ? "#8BC34A"
                                : "#EF4444",
                              backgroundColor: !member.isBlocked
                                ? "rgba(139,195,74,0.1)"
                                : "rgba(239,68,68,0.1)",
                              marginRight: 12,
                            }}
                          >
                            {!member.profilePictureUrl ? (
                              <ThemedText
                                style={{
                                  fontWeight: "800",
                                  color: !member.isBlocked
                                    ? "#8BC34A"
                                    : "#EF4444",
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
                              backgroundColor: !member.isBlocked
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(239,68,68,0.1)",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 12,
                              marginRight: 8,
                            }}
                          >
                            <ThemedText
                              style={{
                                color: !member.isBlocked
                                  ? "#22C55E"
                                  : "#EF4444",
                                fontSize: 11,
                                fontWeight: "800",
                              }}
                            >
                              {!member.isBlocked ? "ACTIVE" : "BLOCKED"}
                            </ThemedText>
                          </Box>
                          <Ionicons
                            name={
                              expanded[member.id]
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color={isDark ? "#555" : "#CCC"}
                          />
                        </HStack>
                      </HStack>
                    </Pressable>

                    {/* EXPANDED DETAILS */}
                    {expanded[member.id] && (
                      <VStack style={{ marginTop: 20 }}>
                        <Divider
                          style={{
                            marginBottom: 16,
                            backgroundColor: isDark ? "#333" : "#F0F0F0",
                          }}
                        />

                        {/* Grid Info */}
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
                                color="#8BC34A"
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
                                color="#8BC34A"
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
                                color="#8BC34A"
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
                                      color: "#8BC34A",
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
                                color="#FFB300"
                              />
                              <ThemedText
                                style={{
                                  marginLeft: 6,
                                  fontSize: 15,
                                  fontWeight: "800",
                                  color: "#FFB300",
                                }}
                              >
                                {member.handicap}
                              </ThemedText>
                            </HStack>
                          </VStack>
                        </HStack>

                        {/* Actions */}
                        <HStack
                          style={{ marginTop: 24, justifyContent: "flex-end" }}
                        >
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
                            onPress={() =>
                              console.log("Block Toggle", member.id)
                            }
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
