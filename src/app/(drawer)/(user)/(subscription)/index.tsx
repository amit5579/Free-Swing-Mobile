import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
  TextInput,
  FlatList,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Skeleton } from "@/components/Skeleton";
import { getUser } from "@/api/modules/subAdmin/dashboard.api";
import { LinearGradient } from "expo-linear-gradient";

export default function SubscriptionsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, []);

  const fetchSubscriptions = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const uu = await getUser();

      setUserData(uu);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(true);
  }, []);

  const formatDate = (dateString: any) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };
  const RenderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#161618" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
            <Pressable
              onPress={() => routePage.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#f1f5f9",
              }}
              android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#8BC34A"
              />
            </Pressable>

            {/* 🧠 TITLE */}
            <ThemedText
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#fff" : "#020617",
                paddingHorizontal: 8,
              }}
            >
              Subscription Details
            </ThemedText>

            {/* ⚖️ RIGHT SPACER */}
            <View style={{ width: 40 }} />
          </HStack>
          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
            }}
          >
            Manage your plan, renewals, and view active status
          </ThemedText>
        </VStack>
      </Box>
    );
  };

  const SubscriptionPageSkeleton = ({ isDark }: { isDark: boolean }) => (
    <VStack className="px-4 pt-5 pb-24" space="lg">
      {/* Active Plan Skeleton */}
      <Box
        style={{
          padding: 16,
          borderRadius: 20,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
        }}
      >
        <HStack className="justify-between items-center" style={{ gap: 16 }}>
          <VStack style={{ flex: 1 }}>
            <Skeleton
              isDark={isDark}
              height={20}
              width={70}
              borderRadius={8}
              style={{ marginBottom: 8 }}
            />
            <Skeleton
              isDark={isDark}
              height={24}
              width={140}
              borderRadius={8}
              style={{ marginBottom: 6 }}
            />
            <Skeleton isDark={isDark} height={14} width="80%" borderRadius={6} />
          </VStack>
          <Skeleton isDark={isDark} height={72} width={72} borderRadius={36} />
        </HStack>
      </Box>

      {/* Stats Cards Skeleton */}
      <HStack space="md">
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            style={{
              width: 150,
              padding: 16,
              borderRadius: 20,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(139, 195, 74, 0.35)"
                : "rgba(139, 195, 74, 0.45)",
            }}
          >
            <Skeleton
              isDark={isDark}
              height={32}
              width={32}
              borderRadius={10}
              style={{ marginBottom: 12 }}
            />
            <Skeleton
              isDark={isDark}
              height={12}
              width={60}
              borderRadius={6}
              style={{ marginBottom: 6 }}
            />
            <Skeleton isDark={isDark} height={16} width={80} borderRadius={6} />
          </Box>
        ))}
      </HStack>

      {/* Timeline Skeleton */}
      <Box
        style={{
          padding: 18,
          borderRadius: 20,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
        }}
      >
        <HStack className="items-center mb-4" style={{ gap: 8 }}>
          <Skeleton isDark={isDark} height={20} width={20} borderRadius={10} />
          <VStack style={{ gap: 4 }}>
            <Skeleton isDark={isDark} height={16} width={100} borderRadius={6} />
            <Skeleton
              isDark={isDark}
              height={12}
              width={160}
              borderRadius={8}
            />
          </VStack>
        </HStack>
        <HStack className="flex-wrap justify-between" style={{ rowGap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={60}
              width="48%"
              borderRadius={16}
            />
          ))}
        </HStack>
      </Box>

      {/* Pending Request Skeleton */}
      <Box
        style={{
          padding: 18,
          borderRadius: 20,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
        }}
      >
        <Skeleton
          isDark={isDark}
          height={20}
          width={140}
          borderRadius={8}
          style={{ marginBottom: 12 }}
        />
        <Skeleton isDark={isDark} height={50} width="100%" borderRadius={16} />
      </Box>
    </VStack>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#161618" : "#ffffff",
      }}
    >
      <RenderHeader />
      <Watermark />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8BC34A"]}
            tintColor="#8BC34A"
          />
        }
      >
        {loading ? (
          <SubscriptionPageSkeleton isDark={isDark} />
        ) : (
          <VStack className="px-4 pt-5 pb-24" space="lg">
            {/* 🔴 ACTIVE PLAN CARD */}
            <Box
              style={{
                padding: 16,
                borderRadius: 20,
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(139, 195, 74, 0.35)"
                  : "rgba(139, 195, 74, 0.45)",
              }}
            >
              <HStack
                className="justify-between items-center"
                style={{ gap: 16 }}
              >
                {/* LEFT */}
                <VStack style={{ flex: 1 }}>
                  <Box
                    style={{
                      backgroundColor:
                        userData?.subscriptionStatus === "Active"
                          ? "rgba(132, 204, 22, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color:
                          userData?.subscriptionStatus === "Active"
                            ? "#84cc16"
                            : "#f59e0b",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {userData?.subscriptionStatus || "INACTIVE"}
                    </ThemedText>
                  </Box>

                  <ThemedText
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      letterSpacing: -0.5,
                    }}
                  >
                    {userData?.activeSubscriptionPlanLabel || "No Active Plan"}
                  </ThemedText>

                  <ThemedText
                    style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}
                  >
                    {userData?.subscriptionStatus === "Active"
                      ? "Your membership is currently active."
                      : "Please renew your plan to enjoy full benefits."}
                  </ThemedText>
                </VStack>

                {/* RIGHT BOX */}
                <Box
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#84cc16",
                  }}
                >
                  {userData?.daysRemaining !== undefined ? (
                    <VStack className="items-center">
                      <ThemedText
                        style={{
                          color: "#fff",
                          fontSize: 22,
                          fontWeight: "900",
                          lineHeight: 24,
                        }}
                      >
                        {userData?.daysRemaining}
                      </ThemedText>
                      <ThemedText
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 8,
                          fontWeight: "700",
                          textTransform: "uppercase",
                        }}
                      >
                        Days Left
                      </ThemedText>
                    </VStack>
                  ) : (
                    <Ionicons
                      name="alert-circle-outline"
                      size={32}
                      color="#fff"
                    />
                  )}
                </Box>
              </HStack>
            </Box>

            {/* 📊 STATS CARDS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack space="md" style={{ paddingRight: 20 }}>
                {[
                  {
                    title: "Plan Type",
                    value: userData?.activeSubscriptionPlanLabel || "None",
                    icon: "card-outline",
                    color: "#3b82f6",
                  },
                  {
                    title: "Validity",
                    value:
                      userData?.daysRemaining !== undefined
                        ? `${userData.daysRemaining} Days`
                        : "N/A",
                    icon: "time-outline",
                    color: "#84cc16",
                  },
                  {
                    title: "Account Status",
                    value: userData?.subscriptionStatus || "Inactive",
                    icon: "shield-checkmark-outline",
                    color: "#f59e0b",
                  },
                ].map((item, index) => (
                  <Box
                    key={index}
                    style={{
                      width: 150,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(139, 195, 74, 0.35)"
                        : "rgba(139, 195, 74, 0.45)",
                    }}
                  >
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: `${item.color}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={item.color}
                      />
                    </Box>

                    <ThemedText
                      style={{
                        fontSize: 11,
                        opacity: 0.5,
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.title}
                    </ThemedText>

                    <ThemedText
                      style={{ fontSize: 14, fontWeight: "700", marginTop: 2 }}
                    >
                      {item.value}
                    </ThemedText>
                  </Box>
                ))}
              </HStack>
            </ScrollView>

            {/* 📅 PLAN TIMELINE */}
            <Box
              style={{
                padding: 18,
                borderRadius: 20,
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(139, 195, 74, 0.35)"
                  : "rgba(139, 195, 74, 0.45)",
              }}
            >
              <HStack className="items-center mb-4" style={{ gap: 8 }}>
                <Ionicons name="calendar" size={20} color="#84cc16" />
                <VStack>
                  <ThemedText style={{ fontSize: 16, fontWeight: "800" }}>
                    Plan Timeline
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
                    Key dates for your current cycle.
                  </ThemedText>
                </VStack>
              </HStack>

              {/* Timeline grid */}
              <HStack
                className="flex-wrap justify-between"
                style={{ rowGap: 12 }}
              >
                {[
                  {
                    title: "Approved On",
                    value: formatDate(userData?.subscriptionApprovedAtUtc),
                    icon: "checkmark-circle-outline",
                  },
                  {
                    title: "Starts On",
                    value: formatDate(userData?.subscriptionStartsAtUtc),
                    icon: "play-circle-outline",
                  },
                  {
                    title: "Expires On",
                    value: formatDate(userData?.subscriptionEndsAtUtc),
                    icon: "stop-circle-outline",
                  },
                  {
                    title: "Plan Duration",
                    value: userData?.activeSubscriptionPlanLabel || "N/A",
                    icon: "repeat-outline",
                  },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: "48%",
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)",
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(139, 195, 74, 0.2)"
                        : "rgba(139, 195, 74, 0.2)",
                    }}
                  >
                    <HStack className="items-center mb-1" style={{ gap: 4 }}>
                      <Ionicons
                        name={item.icon as any}
                        size={12}
                        color="#84cc16"
                      />
                      <ThemedText
                        style={{
                          fontSize: 10,
                          opacity: 0.5,
                          fontWeight: "700",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.title}
                      </ThemedText>
                    </HStack>
                    <ThemedText style={{ fontSize: 13, fontWeight: "700" }}>
                      {item.value}
                    </ThemedText>
                  </Box>
                ))}
              </HStack>
            </Box>

            {/* 🟡 PENDING REQUEST */}
            <Box
              style={{
                padding: 18,
                borderRadius: 20,
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(139, 195, 74, 0.35)"
                  : "rgba(139, 195, 74, 0.45)",
              }}
            >
              <HStack className="items-center mb-3" style={{ gap: 8 }}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <ThemedText style={{ fontSize: 16, fontWeight: "800" }}>
                  Pending Request
                </ThemedText>
              </HStack>

              <Box
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(245, 158, 11, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(245, 158, 11, 0.2)",
                  borderStyle: "dashed",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#fbbf24" : "#d97706",
                    textAlign: "center",
                  }}
                >
                  {userData?.pendingSubscriptionRequestType ||
                    "No Pending Subscription Request"}
                </ThemedText>
              </Box>

              {/* INFO BOX */}
              <HStack
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#84cc16"
                />
                <ThemedText style={{ fontSize: 11, opacity: 0.6, flex: 1 }}>
                  If your plan is expired or renewal is pending, please contact
                  admin for assistance.
                </ThemedText>
              </HStack>
            </Box>

            {/* 🟢 CTA BUTTON */}
            <Pressable
              onPress={() => {
                routePage.push("/(drawer)/(user)/(contactAdmin)");
              }}
              style={{ borderRadius: 12 }}
            >
              <LinearGradient
                colors={["#8bc34a", "#558b2f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  shadowColor: "#8bc34a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                  Contact Admin
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
