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
import { getFeedback, updateFeedback } from "@/api/admin/feedback";
import { Dropdown } from "react-native-element-dropdown";

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
    { key: "ongoing", label: "Ongoing", icon: "people-outline" },
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
        {[1, 2, 3].map((_, i) => (
          <Box key={i} className="p-4 rounded-xl border border-neutral-200">
            <VStack space="sm">
              <Box className="h-4 w-3/4 bg-gray-300 rounded" />
              <Box className="h-3 w-1/2 bg-gray-300 rounded" />
              <Box className="h-16 w-full bg-gray-200 rounded" />
              <Box className="h-10 w-full bg-gray-200 rounded" />
            </VStack>
          </Box>
        ))}
      </VStack>
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
        <Ionicons name="cube-outline" size={40} color="#9ca3af" />

        <Text
          style={{
            marginTop: 10,
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          No feedback in this view
        </Text>

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
      if (activeTab === "ongoing") return item.status === "Ongoing";
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
  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
          }}
        >
          <Watermark />
          <ScrollView>
            <VStack className="flex-1 p-4">
              {/* HEADER (FIXED) */}
              <HStack className="items-center justify-between mb-4">
                <Pressable onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={24} color="#8bc34a" />
                </Pressable>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: isDark ? "#9ca3af" : "black",
                  }}
                >
                  Feedback Inbox
                </Text>

                <View style={{ width: 24 }} />
              </HStack>

              <VStack
                style={{
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  marginBottom: 16,
                }}
              >
                {/* Badge */}
                <Text
                  style={{
                    fontSize: 10,
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
                    fontSize: 15,
                    fontWeight: "700",
                    marginBottom: 4,
                    color: isDark ? "#9ca3af" : "black",
                  }}
                >
                  Feedback & Requests
                </Text>

                {/* Subtitle */}
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 12,
                  }}
                >
                  Manage user feedback and updates
                </Text>

                {/* Stats Grid */}
                <HStack
                  style={{ flexWrap: "wrap", justifyContent: "space-between" }}
                >
                  {[
                    { label: "Total", value: 2 },
                    { label: "Open", value: 0 },
                    { label: "Ongoing", value: 0 },
                    { label: "Resolved", value: 2 },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      style={{
                        width: "48%",
                        padding: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                        {item.value}
                      </ThemedText>
                      <Text style={{ fontSize: 11, color: "#6b7280" }}>
                        {item.label}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </VStack>
              {/* Tab Buttons */}
              <HStack
                className="rounded-full p-1 mb-6"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(229, 231, 235, 0.6)",
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
                        className={`text-sm font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}
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
              {activeTab === "ongoing" && (
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
      </ThemedView>
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
    <Box className="p-4 rounded-xl border border-neutral-200 mb-4">
      <VStack space="sm">
        <HStack className="gap-3">
          <Box
            style={{
              backgroundColor: item.status === "Bug" ? "#8BC34A" : "#8bc34a24",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: item.status === "Bug" ? "#fff" : "#8BC34A" }}>
              Bug
            </Text>
          </Box>
          <Box
            style={{
              backgroundColor:
                item.status === "Resolved" ? "#8BC34A" : "#8bc34a24",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
            }}
          >
            <Text
              style={{ color: item.status === "Resolved" ? "#fff" : "#8BC34A" }}
            >
              Resolved
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
        <ThemedText style={{ fontSize: 12 }}>
          Updated: {formatDateTime(item.updatedAt)}
        </ThemedText>

        {/* MESSAGE */}
        <Box
          className="p-3 rounded-lg border border-neutral-200"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(229, 231, 235, 0.6)",
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
            style={{
              padding: 10,
              borderRadius: 7,
              borderColor: "#e5e5e5",
              borderWidth: 1,
            }}
            selectedTextStyle={{
              color: isDark ? "white" : "black",
            }}
            itemTextStyle={{
              color: isDark ? "white" : "black",
            }}
            placeholderStyle={{
              color: isDark ? "white" : "black",
            }}
            data={[
              { label: "Open", value: "Open" },
              { label: "Resolved", value: "Resolved" },
              { label: "Ongoing", value: "In Progress" },
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
              borderColor: "#e5e5e5",
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
