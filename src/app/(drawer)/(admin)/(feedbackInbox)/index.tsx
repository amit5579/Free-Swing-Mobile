import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Pressable, TextInput, useColorScheme, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/text";
import { Box } from "@/components/box";
import { getFeedback, updateFeedback } from "@/api/modules/admin/feedback.api";
import { Dropdown } from "react-native-element-dropdown";
import { Skeleton } from "@/components/Skeleton";

export default function FeedbackInboxPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const [feedbackData, setFeedbackData] = useState<any>([]);

  const tabs = [
    { key: "all", label: "All", icon: "grid-outline" },
    { key: "open", label: "Open", icon: "people-outline" },
    { key: "InProgress", label: "Ongoing", icon: "people-outline" },
    { key: "resolved", label: "Resolved", icon: "people-outline" },
  ];

  const fetchInbox = async () => {
    setIsLoading(true);
    const feedback = await getFeedback();
    setFeedbackData(feedback);
    setIsLoading(false);
  };

  const setUpdateFeedback = async (
    feedbackId: number,
    adminResponse: string,
    status: string,
  ) => {
    try {
      await updateFeedback(feedbackId, adminResponse, status);
      fetchInbox();
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const LoadingState = () => {
    return (
      <VStack space="md">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeedbackCardSkeleton key={i} isDark={isDark} />
        ))}
      </VStack>
    );
  };

  const StatsSkeleton = () => {
    return (
      <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box
            key={i}
            style={{
              width: "48%",
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#262626" : "#e5e7eb",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <Skeleton
              isDark={isDark}
              height={16}
              width={30}
              style={{ marginBottom: 4 }}
            />
            <Skeleton isDark={isDark} height={10} width={40} />
          </Box>
        ))}
      </HStack>
    );
  };

  const EmptyState = () => {
    return (
      <VStack
        style={{
          alignItems: "center",
          justifyContent: "center",
          marginTop: 80,
        }}
      >
        <Ionicons name="cube-outline" size={40} color="#8bc34a" />

        <ThemedText
          style={{
            marginTop: 10,
            fontWeight: "600",
            fontSize: 17,
          }}
        >
          No feedback in this view
        </ThemedText>

        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          New user messages will appear here when they are submitted.
        </Text>
      </VStack>
    );
  };

  const renderContent = () => {
    const filteredData = feedbackData.filter((item: any) => {
      if (activeTab === "all") return true;
      if (activeTab === "open") return item.status === "Open";
      if (activeTab === "InProgress") return item.status === "InProgress";
      if (activeTab === "resolved") return item.status === "Resolved";
    });
    if (isLoading) return <LoadingState />;

    if (!filteredData.length) return <EmptyState />;

    return (
      <VStack>
        {filteredData.map((item: any) => (
          <FeedbackCard
            key={item.id}
            isDark={isDark}
            item={item}
            setUpdateFeedback={setUpdateFeedback}
          />
        ))}
      </VStack>
    );
  };

  const FeedbackCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        className="p-4 rounded-xl mb-4"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#262626" : "#e5e5e5",
        }}
      >
        <VStack space="sm">
          {/* Tags */}
          <HStack>
            <Skeleton
              isDark={isDark}
              height={20}
              width={60}
              borderRadius={10}
            />
            <Skeleton
              isDark={isDark}
              height={20}
              width={70}
              borderRadius={10}
              style={{ marginLeft: 8 }}
            />
          </HStack>

          {/* Title */}
          <Skeleton isDark={isDark} height={14} width="70%" />

          {/* User info */}
          <Skeleton isDark={isDark} height={12} width="90%" />

          {/* Dates */}
          <Skeleton isDark={isDark} height={12} width="60%" />
          <Skeleton isDark={isDark} height={12} width="60%" />

          {/* Message box */}
          <Skeleton
            isDark={isDark}
            height={60}
            borderRadius={8}
            style={{ marginTop: 6 }}
          />

          {/* Dropdown */}
          <Skeleton
            isDark={isDark}
            height={40}
            borderRadius={8}
            style={{ marginTop: 6 }}
          />

          {/* Textarea */}
          <Skeleton
            isDark={isDark}
            height={80}
            borderRadius={8}
            style={{ marginTop: 6 }}
          />

          {/* Button */}
          <Skeleton
            isDark={isDark}
            height={40}
            borderRadius={8}
            style={{ marginTop: 6 }}
          />
        </VStack>
      </Box>
    );
  };

  const renderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        marginBottom: 20,
      }}
    >
      <VStack style={{ paddingTop: 14, paddingBottom: 12 }}>
        {/* 🔝 TOP ROW */}
        <HStack
          style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* 🔙 BACK */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            }}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#fff" : "#020617"}
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
            Feedback Inbox
          </ThemedText>

          {/* ⚖️ RIGHT SPACER */}
          <View style={{ width: 40 }} />
        </HStack>
      </VStack>
    </Box>
  );

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        <Watermark />
        <ScrollView>
          <VStack className="flex-1 p-4">
            {/* HEADER (FIXED) */}
            {renderHeader()}

            <VStack
              style={{
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                marginBottom: 16,
              }}
            >
              {/* Badge */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#8BC34A",
                  marginBottom: 6,
                }}
              >
                ADMIN INBOX
              </Text>

              {/* Title */}
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  marginBottom: 4,
                  color: isDark ? "#ccd1dbff" : "black",
                }}
              >
                Feedback & Requests
              </Text>

              {/* Subtitle */}
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#ccd1dbff" : "black",
                  marginBottom: 12,
                }}
              >
                Manage user feedback and updates
              </Text>

              {/* Stats Grid */}
              {isLoading ? (
                <StatsSkeleton />
              ) : (
                <HStack
                  style={{
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {[
                    { label: "Total", value: feedbackData.length || 0 },
                    {
                      label: "Open",
                      value:
                        feedbackData.filter(
                          (item: any) => item.status === "Open",
                        ).length || 0,
                    },
                    {
                      label: "Ongoing",
                      value:
                        feedbackData.filter(
                          (item: any) => item.status === "InProgress",
                        ).length || 0,
                    },
                    {
                      label: "Resolved",
                      value:
                        feedbackData.filter(
                          (item: any) => item.status === "Resolved",
                        ).length || 0,
                    },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      style={{
                        width: "48%",
                        padding: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? "#262626" : "#e5e7eb",
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <ThemedText style={{ fontSize: 19, fontWeight: "700" }}>
                        {item.value}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11 }}>
                        {item.label}
                      </ThemedText>
                    </Box>
                  ))}
                </HStack>
              )}
            </VStack>
            {/* Tab Buttons */}
            <HStack
              className="rounded-full p-1 mb-6"
              style={{
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                borderWidth: 1,
              }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className="flex-1 px-4 py-4 rounded-full flex-row items-center justify-center"
                    style={active ? { backgroundColor: "#8BC34A" } : {}}
                  >
                    {/* <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={active ? "#fff" : isDark ? "#aaa" : "#6b7280"}
                  className="mr-1"
                /> */}
                    <Text
                      className={`text-sm font-medium ${active ? "text-white" : isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
            {/* CONTENT */}

            {activeTab === "all" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
              </ScrollView>
            )}

            {activeTab === "open" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
              </ScrollView>
            )}
            {activeTab === "InProgress" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
              </ScrollView>
            )}
            {activeTab === "resolved" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
              </ScrollView>
            )}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const FeedbackCard = ({ isDark, item, setUpdateFeedback }: any) => {
  const [status, setStatus] = useState(item.status); // initial value
  const [reply, setReply] = useState(item.adminResponse || "");

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      // second: "",
      hour12: true,
    });
  };

  useEffect(() => {
    setReply(item.adminResponse || "");
    setStatus(item.status);
  }, [item]);

  return (
    <Box
      className="p-4 rounded-xl border border-neutral-200 mb-4"
      style={{
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      }}
    >
      <VStack space="sm">
        <HStack className="gap-3">
          <Box
            style={{
              backgroundColor:
                //  item.status === "Bug" ?
                // "#8BC34A" :
                "#8bc34a24",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color:
                  // item.status === "Bug" ?
                  // "#fff"  :
                  "#8BC34A",
              }}
            >
              {item.category}
            </Text>
          </Box>
          <Box
            style={{
              backgroundColor:
                // item.status === "Resolved" ?
                "#8BC34A",
              // : "#8bc34a24"
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color:
                  // item.status === "Resolved" ?
                  "#fff",
                //  : "#8BC34A"
              }}
            >
              {item.status == "InProgress" ? "Ongoing" : item.status}
            </Text>
          </Box>
        </HStack>

        {/* TITLE */}
        <ThemedText style={{ fontWeight: "600", fontSize: 14 }}>
          {item.subject}
        </ThemedText>

        {/* USER INFO */}
        <ThemedText style={{ fontSize: 12 }}>
          {item.username} ({item.role}) • {item.email}
        </ThemedText>

        <ThemedText style={{ fontSize: 12 }}>
          Submitted: {formatDateTime(item.createdAt)}
        </ThemedText>

        {item.updatedAt == null ? (
          ""
        ) : (
          <ThemedText style={{ fontSize: 12 }}>
            Updated: {formatDateTime(item.updatedAt) || ""}
          </ThemedText>
        )}

        {/* MESSAGE */}
        <Box
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          }}
        >
          <ThemedText style={{ fontSize: 13 }}>{item.message}</ThemedText>
        </Box>

        {/* STATUS */}
        <VStack>
          <ThemedText style={{ fontSize: 12, marginBottom: 4 }}>
            Status
          </ThemedText>
          <Dropdown
            style={[
              {
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 45,
                marginTop: 6,
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
              },
            ]}
            placeholderStyle={{ color: isDark ? "#fff" : "#000" }}
            selectedTextStyle={{ color: isDark ? "#fff" : "#000" }}
            containerStyle={{
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
              borderColor: isDark ? "#333" : "#ddd",
            }}
            itemTextStyle={{ color: isDark ? "#fff" : "#000" }}
            activeColor={isDark ? "#333" : "#f0f0f0"}
            data={[
              { label: "Open", value: "Open" },
              { label: "Resolved", value: "Resolved" },
              { label: "Ongoing", value: "InProgress" },
            ]}
            labelField="label"
            valueField="value"
            placeholder="Select course"
            value={status}
            onChange={(item) => {
              setStatus(item.value);
            }}
          />
        </VStack>

        {/* ADMIN REPLY */}
        <VStack>
          <ThemedText style={{ fontSize: 12, marginBottom: 4 }}>
            Admin Reply
          </ThemedText>
          <TextInput
            placeholder="Admin Reply"
            multiline
            numberOfLines={3}
            style={{
              borderRadius: 7,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              borderColor: isDark ? "#1e293b" : "#e2e8f0",
              borderWidth: 1,
              padding: 10,
              height: 80,
              textAlignVertical: "top",
              color: isDark ? "white" : "black",
            }}
            placeholderTextColor={isDark ? "white" : "black"}
            value={reply}
            onChangeText={(text: string) => {
              setReply(text);
            }}
          />
        </VStack>

        {/* BUTTON */}
        <Pressable
          onPress={() => setUpdateFeedback(item.id, reply, status)}
          style={{
            backgroundColor: "#8BC34A",
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Save Update</Text>
        </Pressable>
      </VStack>
    </Box>
  );
};
