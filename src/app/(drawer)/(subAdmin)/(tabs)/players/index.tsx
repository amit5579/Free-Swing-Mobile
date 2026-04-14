import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  FlatList,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Watermark from "@/components/watermark";
import { Skeleton } from "@/components/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  getSubAdminPlayers,
  invitePlayer,
  getSubAdminCourses,
  deleteSubAdminPlayer,
  blockPlayer,
  unblockPlayer,
} from "@/api/subAdmin/myPlayers";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invitePlayerSchema, InvitePlayerType } from "@/schema/subAdminSchema";
import { useRouter } from "expo-router";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Player {
  id: number;
  username: string;
  email: string;
  membershipNo: string | null;
  mobileNumber: string;
  handicap: number;
  handicapIndex: number | null;
  totalRounds: number;
  averageScore: number;
  role: string;
  isBlocked: boolean;
}

interface Course {
  courseId: number;
  name: string;
  location: string;
  slope: number;
  rating: number;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SubAdminPlayersPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Delete Modal State ──
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Blocked"
  >("All");

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

  // ── Form ──
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvitePlayerType>({
    resolver: zodResolver(invitePlayerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      membershipNo: "",
      mobileNumber: "",
      dateOfBirth: "",
      handicap: 0,
      handicapIndex: 0,
    },
  });

  const watchedDob = watch("dateOfBirth");

  // ── Fetch ──
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getSubAdminPlayers();
      const courseData = await getSubAdminCourses();
      setPlayers(data);
      setCourses(courseData);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        player.username.toLowerCase().includes(searchLower) ||
        player.email.toLowerCase().includes(searchLower) ||
        (player.membershipNo && player.membershipNo.toLowerCase().includes(searchLower)) && player.role != "CourseMarshal";

      const matchesStatus =
        statusFilter === "All" && player.role != "CourseMarshal"||
        (statusFilter === "Active" && !player.isBlocked && player.role != "CourseMarshal") ||
        (statusFilter === "Blocked" && player.isBlocked && player.role != "CourseMarshal");

      return matchesSearch && matchesStatus;
    });
  }, [players, searchQuery, statusFilter]);

  useFocusEffect(
    React.useCallback(() => {
      fetchPlayers();
    }, []),
  );

  // ── Submit Form ──
  const onSubmit = async (data: InvitePlayerType) => {
    try {
      setSubmitting(true);
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        membershipNo: data.membershipNo,
        mobileNumber: data.mobileNumber || "",
        dateOfBirth: data.dateOfBirth || "",
        handicap: data.handicap,
        handicapIndex: data.handicapIndex,
      };

      await invitePlayer(payload);
      Toast.show({
        type: "success",
        text1: "Player added successfully",
      });
      setModalVisible(false);
      reset();
      fetchPlayers();
    } catch (error) {
      console.error("Error adding player:", error);
      Toast.show({
        type: "error",
        text1: "Failed to add player",
        text2: "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockPlayer = async (id: number, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await unblockPlayer(id);
        Toast.show({
          type: "success",
          text1: "Player unblocked successfully",
        });
      } else {
        await blockPlayer(id);
        Toast.show({
          type: "success",
          text1: "Player blocked successfully",
        });
      }
      fetchPlayers();
    } catch (error) {
      console.error("Error blocking player:", error);
      Toast.show({
        type: "error",
        text1: "Failed to block player",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Date Formatting ──
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ── Course info (first course from response) ──
  const courseInfo = courses.length > 0 ? courses[0] : null;

  // ── Skeleton ──
  const PlayerCardSkeleton = () => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <HStack style={{ alignItems: "center", marginBottom: 14 }}>
        <Skeleton isDark={isDark} height={44} width={44} borderRadius={22} />
        <VStack style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton isDark={isDark} height={16} width="55%" />
          <Skeleton
            isDark={isDark}
            height={12}
            width="75%"
            style={{ marginTop: 6 }}
          />
        </VStack>
        <Skeleton isDark={isDark} height={22} width={55} borderRadius={11} />
      </HStack>

      <View style={styles.statsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statBox}>
            <Skeleton isDark={isDark} height={10} width={40} />
            <Skeleton
              isDark={isDark}
              height={18}
              width={30}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
        <Skeleton isDark={isDark} height={12} width="40%" />
      </View>
    </View>
  );

  // ── Empty State ──
  const EmptyState = () => (
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
          backgroundColor: colors.iconBg,
          padding: 18,
          borderRadius: 50,
          marginBottom: 16,
        }}
      >
        <Ionicons name="people-outline" size={32} color={colors.subText} />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        No Players Found
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: colors.subText,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Players assigned to your account will appear here. Tap "Add Player" to
        invite one.
      </ThemedText>
    </VStack>
  );

  // ── Action Button (for card) ──
  const ActionButton = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        gap: 3,
        flex: 1,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: color,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `${color}10`,
        }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <ThemedText
        style={{
          fontSize: 10,
          color: colors.subText,
          fontWeight: "500",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  // ── Player Card ──
  const renderPlayerCard = ({ item }: { item: Player }) => {
    const initials = item.username.slice(0, 2).toUpperCase();
    const isActive = !item.isBlocked;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* ─── Header: Avatar + Name + Status ─── */}
        <HStack style={{ alignItems: "center", marginBottom: 14 }}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <ThemedText
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.accent,
              }}
            >
              {initials}
            </ThemedText>
          </View>

          <VStack style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {item.username}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 13,
                color: colors.subText,
                marginTop: 2,
              }}
            >
              {item.email}
            </ThemedText>
          </VStack>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(239,68,68,0.12)",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isActive
                    ? colors.statusActive
                    : colors.statusBlocked,
                },
              ]}
            />
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? colors.statusActive : colors.statusBlocked,
              }}
            >
              {isActive ? "Active" : "Blocked"}
            </ThemedText>
          </View>
        </HStack>

        {/* ─── Stats Grid ─── */}
        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: isDark
                ? "rgba(15,23,42,0.4)"
                : "rgba(241,245,249,0.6)",
            },
          ]}
        >
          <StatItem
            label="Handicap"
            value={item.handicap.toString()}
            icon="golf-outline"
            colors={colors}
          />
          <StatItem
            label="HC Index"
            value={
              item.handicapIndex !== null ? item.handicapIndex.toString() : "—"
            }
            icon="analytics-outline"
            colors={colors}
          />
          <StatItem
            label="Rounds"
            value={item.totalRounds.toString()}
            icon="flag-outline"
            colors={colors}
          />
          <StatItem
            label="Avg Score"
            value={item.averageScore > 0 ? item.averageScore.toString() : "—"}
            icon="stats-chart-outline"
            colors={colors}
          />
        </View>

        {/* ─── Footer: Membership + Role + Phone ─── */}
        <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
          <HStack
            style={{
              alignItems: "center",
              flex: 1,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <HStack style={{ alignItems: "center", gap: 4 }}>
              <Ionicons name="card-outline" size={14} color={colors.dimText} />
              <ThemedText style={{ fontSize: 12, color: colors.dimText }}>
                {item.membershipNo || "No Membership"}
              </ThemedText>
            </HStack>
            <HStack style={{ alignItems: "center", gap: 4 }}>
              <Ionicons
                name="shield-outline"
                size={14}
                color={colors.dimText}
              />
              <ThemedText style={{ fontSize: 12, color: colors.dimText }}>
                {item.role}
              </ThemedText>
            </HStack>
            <HStack style={{ alignItems: "center", gap: 4 }}>
              <Ionicons name="call-outline" size={14} color={colors.dimText} />
              <ThemedText style={{ fontSize: 12, color: colors.dimText }}>
                {item.mobileNumber}
              </ThemedText>
            </HStack>
          </HStack>
        </View>

        {/* ─── Action Buttons ─── */}
        <View style={[styles.actionsRow, { borderTopColor: colors.divider }]}>
          <ActionButton
            icon="time-outline"
            label="History"
            color="#06b6d4"
            onPress={() => {
              routePage.push(
                `/(drawer)/(subAdmin)/(tabs)/players/subGameHistory?playerId=${item.id}&playerName=${item.username}`,
              );
            }}
          />
          <ActionButton
            icon="document-text-outline"
            label="HC Cert"
            color="#f59e0b"
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Handicap Certificate",
                text2: `Viewing certificate for ${item.username}`,
              });
              routePage.push(
                `/(drawer)/(subAdmin)/(tabs)/players/playerCertificate?userId=${item.id}`,
              );
            }}
          />
          <ActionButton
            icon={item.isBlocked ? "lock-open-outline" : "ban-outline"}
            label={item.isBlocked ? "Unblock" : "Block"}
            color={item.isBlocked ? "#22c55e" : "#f97316"}
            onPress={() => {
              handleBlockPlayer(item.id, item.isBlocked);
              // Toast.show({
              //   type: "info",
              //   text1: item.isBlocked
              //     ? `Unblock ${item.username}?`
              //     : `Block ${item.username}?`,
              // });
            }}
          />
          <ActionButton
            icon="trash-outline"
            label="Delete"
            color="#ef4444"
            onPress={() => {
              setPlayerToDelete(item);
              setDeleteModalVisible(true);
            }}
          />
        </View>
      </View>
    );
  };

  // ── Form Field Helper ──
  const FormField = ({
    label,
    required,
    children,
    error,
    halfWidth,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
    halfWidth?: boolean;
  }) => (
    <View style={[styles.fieldContainer, halfWidth && { width: "48%" }]}>
      <ThemedText
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        {label}
        {required && (
          <ThemedText style={{ color: "#ef4444", fontSize: 13 }}> *</ThemedText>
        )}
      </ThemedText>
      {children}
      {error && (
        <ThemedText
          style={{
            color: "#ef4444",
            fontSize: 11,
            marginTop: 4,
          }}
        >
          {error}
        </ThemedText>
      )}
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={{ flex: 1 }}>
      <Watermark />

      {/* ─── Header ─── */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <VStack>
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Players
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 13,
              color: colors.subText,
              marginTop: 2,
            }}
          >
            {loading
              ? "Loading..."
              : `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? "s" : ""}`}
          </ThemedText>
        </VStack>

        <HStack style={{ gap: 10 }}>
          <Pressable
            onPress={() => {
              reset();
              setModalVisible(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#84cc16",
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 10,
            }}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <ThemedText
              style={{
                color: "#fff",
                fontWeight: "600",
                fontSize: 14,
                marginLeft: 6,
              }}
            >
              Add Player
            </ThemedText>
          </Pressable>
        </HStack>
      </View>

      {/* ─── Search & Filters ─── */}
      <VStack className="px-4 mt-4">
        <Box
          className="flex-row items-center px-4 rounded-xl border"
          style={{
            height: 48,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.9)",
            borderColor: colors.cardBorder,
          }}
        >
          <Ionicons name="search" size={20} color={colors.accent} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 10,
              color: colors.text,
              fontSize: 15,
            }}
            placeholder="Search by name, email, membership..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.subText} />
            </Pressable>
          )}
        </Box>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 14 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {["All", "Active", "Blocked"].map((status) => {
            const isSelected = statusFilter === status;
            return (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status as any)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: isSelected ? colors.accent : colors.cardBg,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isSelected ? "#fff" : colors.subText,
                  }}
                >
                  {status}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </VStack>

      {/* ─── List ─── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <PlayerCardSkeleton />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : players.length === 0 ? (
        <EmptyState />
      ) : filteredPlayers.length === 0 ? (
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
              backgroundColor: colors.iconBg,
              padding: 18,
              borderRadius: 50,
              marginBottom: 16,
            }}
          >
            <Ionicons name="search" size={32} color={colors.subText} />
          </View>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 6,
            }}
          >
            No Results Found
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 14,
              color: colors.subText,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            We couldn't find any players matching "{searchQuery}" in{" "}
            {statusFilter} status.
          </ThemedText>
          <Pressable
            onPress={() => {
              setSearchQuery("");
              setStatusFilter("All");
            }}
            style={{ marginTop: 20 }}
          >
            <ThemedText style={{ color: colors.accent, fontWeight: "600" }}>
              Clear all filters
            </ThemedText>
          </Pressable>
        </VStack>
      ) : (
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlayerCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.modalBg,
                width: "90%",
                alignSelf: "center",
                padding: 24,
                alignItems: "center",
              },
            ]}
          >
            {/* Warning Icon */}
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "rgba(132, 204, 22, 0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="warning-outline" size={40} color="#84cc16" />
            </View>

            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Remove Player
            </ThemedText>

            <ThemedText
              style={{
                fontSize: 14,
                color: colors.subText,
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Are you sure you want to remove player "{playerToDelete?.username}
              "?
            </ThemedText>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                width: "100%",
              }}
            >
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#334155" : "#f1f5f9",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#f1f5f9" : "#475569",
                  }}
                >
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={async () => {
                  if (!playerToDelete) return;
                  try {
                    setDeleting(true);
                    await deleteSubAdminPlayer(playerToDelete.id);
                    Toast.show({
                      type: "success",
                      text1: "Player removed successfully",
                    });
                    setDeleteModalVisible(false);
                    fetchPlayers();
                  } catch (error) {
                    Toast.show({
                      type: "error",
                      text1: "Failed to remove player",
                    });
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                style={{
                  flex: 1,
                  backgroundColor: "#84cc16",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  {deleting ? "Removing..." : "Yes, I'm sure"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
              style={[styles.modalContent, { backgroundColor: colors.modalBg }]}
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
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color={colors.accent}
                  />
                  <ThemedText
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    Add Player
                  </ThemedText>
                </HStack>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.subText} />
                </Pressable>
              </HStack>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── Row: Name + Email ── */}
                <View style={[styles.formRow, { gap: 12 }]}>
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
                <View style={[styles.formRow, { gap: 12 }]}>
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
                <View style={[styles.formRow, { gap: 12 }]}>
                  <FormField label="Mobile" halfWidth>
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
                              borderColor: colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                        />
                      )}
                    />
                  </FormField>

                  <FormField label="Date of Birth" halfWidth>
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
                                    selectedDate.toISOString().split("T")[0],
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

                {/* ── Row: Handicap + Handicap Index ── */}
                <View style={[styles.formRow, { gap: 12 }]}>
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

                {/* ── Row: Course Slope + Course Rating (read-only) ── */}
                <View style={[styles.formRow, { gap: 12 }]}>
                  <FormField label="Course Slope" halfWidth>
                    <View
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.disabledBg,
                          borderColor: colors.inputBorder,
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          color: colors.subText,
                        }}
                      >
                        {courseInfo?.slope ?? "—"}
                      </ThemedText>
                    </View>
                  </FormField>

                  <FormField label="Course Rating" halfWidth>
                    <View
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.disabledBg,
                          borderColor: colors.inputBorder,
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          color: colors.subText,
                        }}
                      >
                        {courseInfo?.rating ?? "—"}
                      </ThemedText>
                    </View>
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
                  style={{
                    borderWidth: 1,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    minWidth: 100,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
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
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#84cc16",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    minWidth: 140,
                  }}
                >
                  <Ionicons name="checkmark-outline" size={18} color="#fff" />
                  <ThemedText
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#fff",
                      marginLeft: 4,
                    }}
                  >
                    {submitting ? "Adding..." : "Add Player"}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

// ─── Stat Item Component ─────────────────────────────────────────────────────
function StatItem({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: any;
  colors: any;
}) {
  return (
    <VStack style={styles.statBox}>
      <HStack style={{ alignItems: "center", gap: 4, marginBottom: 4 }}>
        <Ionicons name={icon} size={13} color={colors.dimText} />
        <ThemedText
          style={{
            fontSize: 11,
            color: colors.dimText,
            fontWeight: "500",
          }}
        >
          {label}
        </ThemedText>
      </HStack>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        }}
      >
        {value}
      </ThemedText>
    </VStack>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  listContent: {
    padding: 16,
    paddingBottom: 80,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 12,
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },

  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },

  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  formCol: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  fieldContainer: {
    flex: 1,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
