import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
  TextInput,
  FlatList,
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

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactAdminSchema, ContactAdminType } from "@/schema/userSchemas";
import { LinearGradient } from "expo-linear-gradient";

import { Dropdown } from "react-native-element-dropdown";
import {
  getFeedbackHistory,
  sendFeedback,
} from "@/api/modules/admin/feedback.api";
import { Skeleton } from "@/components/Skeleton";

export default function ContactAdminPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeedback();
    setRefreshing(false);
  }, []);

  // Dummy feedback history (replace with API)
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  // useEffect(() => {
  // console.log("ffff",feedbacks);

  // },[])

  // FORM
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactAdminType>({
    resolver: zodResolver(contactAdminSchema),
  });

  const fetchFeedback = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);

      const response = await getFeedbackHistory();
      setFeedbacks(response);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(true);
  }, []);

  const onSubmit = async (data: ContactAdminType) => {
    await sendFeedback(data.category, data.subject, data.message);
    reset();
    setModalVisible(false);
    fetchFeedback();
  };

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
              Contact Admin
            </ThemedText>

            {/* ⚖️ RIGHT SPACER */}
            <View style={{ width: 40 }} />
          </HStack>
        </VStack>
      </Box>
    );
  };

  const renderFeedbackItem = ({ item }: any) => (
    <Box
      className="p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        borderColor: isDark
          ? "rgba(139, 195, 74, 0.35)"
          : "rgba(139, 195, 74, 0.45)",
        borderWidth: 1,
        borderRadius: 20,
      }}
    >
      <HStack className="justify-between">
        <ThemedText style={{ fontWeight: "600" }}>{item.subject}</ThemedText>

        <HStack className="items-center justify-end gap-3 mb-2">
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: "rgba(59, 57, 30, 0.5)",
            }}
          >
            <ThemedText style={{ fontSize: 12, color: "#facc15" }}>
              {item.category}
            </ThemedText>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: "#facc15",
            }}
          >
            <ThemedText style={{ fontSize: 12 }}>
              {item.status == "InProgress" ? "In Progress" : item.status}
            </ThemedText>
          </View>
        </HStack>
      </HStack>

      <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
        {formatDateTime(item.createdAt)}
      </ThemedText>

      <ThemedText style={{ marginTop: 6 }}>{item.message}</ThemedText>
    </Box>
  );

  const ContactButtonSkeleton = ({ isDark }: { isDark: boolean }) => (
    <Skeleton
      isDark={isDark}
      height={50}
      borderRadius={12}
      style={{ marginBottom: 16 }}
    />
  );

  const FeedbackCardSkeleton = ({ isDark }: { isDark: boolean }) => (
    <Box
      className="p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
        borderColor: isDark
          ? "rgba(139, 195, 74, 0.35)"
          : "rgba(139, 195, 74, 0.45)",
        borderWidth: 1,
        borderRadius: 20,
      }}
    >
      {/* Header */}
      <HStack className="justify-between mb-2">
        <Skeleton isDark={isDark} height={14} width="50%" />
        <Skeleton isDark={isDark} height={20} width={50} borderRadius={8} />
      </HStack>

      {/* Date */}
      <Skeleton isDark={isDark} height={12} width="40%" />

      {/* Message */}
      <Skeleton
        isDark={isDark}
        height={14}
        width="90%"
        style={{ marginTop: 8 }}
      />
      <Skeleton
        isDark={isDark}
        height={14}
        width="70%"
        style={{ marginTop: 4 }}
      />
    </Box>
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
        <VStack className="px-4 pt-5 pb-20">
          {/* BUTTON */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{ borderRadius: 12, marginBottom: 16 }}
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
                + Send Feedback
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <VStack>
            {/* HISTORY */}
            <ThemedText
              style={{ fontSize: 18, fontWeight: "700", marginBottom: 3 }}
            >
              Your Feedback History
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Track the latest status and any admin reply.
            </ThemedText>

            <HStack className="justify-end mb-3">
              <Box className="border border-gray-400 rounded-full px-3 py-1">
                <ThemedText>
                  {feedbacks.length}
                  {feedbacks.length == 1 ? " item" : " items"}
                </ThemedText>
              </Box>
            </HStack>
          </VStack>
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <FeedbackCardSkeleton key={i} isDark={isDark} />
              ))}
            </>
          ) : (
            <>
              {feedbacks.length === 0 ? (
                <VStack
                  className="items-center justify-center mt-10"
                  style={{
                    paddingVertical: 40,
                    borderRadius: 20,
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark
                      ? "rgba(139, 195, 74, 0.35)"
                      : "rgba(139, 195, 74, 0.45)",
                    borderWidth: 1,
                  }}
                >
                  {/* ICON */}
                  <View
                    style={{
                      backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
                      padding: 14,
                      borderRadius: 50,
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={28}
                      color={isDark ? "#94a3b8" : "#475569"}
                    />
                  </View>

                  {/* TITLE */}
                  <ThemedText
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    No Feedback Yet
                  </ThemedText>

                  {/* SUBTEXT */}
                  <ThemedText
                    style={{
                      fontSize: 13,
                      textAlign: "center",
                      opacity: 0.7,
                      paddingHorizontal: 20,
                    }}
                  >
                    You haven’t submitted any feedback yet. Tap on
                    <ThemedText style={{ fontWeight: "600" }}>
                      “Send Feedback”
                    </ThemedText>
                    to get started.
                  </ThemedText>
                </VStack>
              ) : (
                <FlatList
                  data={feedbacks}
                  keyExtractor={(item) => item.id}
                  renderItem={renderFeedbackItem}
                  scrollEnabled={false}
                />
              )}
            </>
          )}
        </VStack>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {/* OUTSIDE CLICK AREA */}
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setModalVisible(false)}
          />

          {/* MODAL CONTENT (NO closing pressable here) */}
          <View
            style={{
              backgroundColor: isDark ? "#333" : "#eee",
              borderRadius: 16,
              padding: 16,
            }}
          >
            {/* HEADER */}
            <HStack className="justify-between items-center mb-4">
              <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                Send Feedback
              </ThemedText>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? "#fff" : "#000"}
                />
              </Pressable>
            </HStack>

            {/* YOUR FORM (Select will now work) */}
            {/* CATEGORY + SUBJECT + MESSAGE */}
            {/* CATEGORY */}
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <>
                  <Box style={{ marginBottom: 10 }}>
                    <ThemedText style={{ marginBottom: 6, fontWeight: "600" }}>
                      Category
                    </ThemedText>

                    <Dropdown
                      style={{
                        borderWidth: 1,
                        borderColor: "#cbd5f5",
                        borderRadius: 10,
                        padding: 10,
                        marginTop: 10,
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
                      containerStyle={{
                        backgroundColor: isDark ? "#333" : "#eee",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                      itemContainerStyle={{
                        backgroundColor: isDark ? "#333" : "#eee",
                      }}
                      activeColor={isDark ? "#333" : "#eee"}
                      data={[
                        { label: "Bug", value: "bug" },
                        { label: "Improvement", value: "improvement" },
                        { label: "General", value: "general" },
                      ]}
                      labelField="label"
                      valueField="value"
                      mode="modal"
                      placeholder="Select category"
                      value={value}
                      onChange={(item) => {
                        onChange(item.value);
                      }}
                    />
                    {errors.category && (
                      <ThemedText
                        style={{ color: "red", fontSize: 12, marginTop: 4 }}
                      >
                        *{errors.category.message}
                      </ThemedText>
                    )}
                  </Box>
                </>
              )}
            />

            {/* SUBJECT */}
            <Controller
              control={control}
              name="subject"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="Subject"
                    placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5f5",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 10,
                      color: isDark ? "#fff" : "#000",
                    }}
                  />
                  {errors.subject && (
                    <ThemedText style={{ color: "red", fontSize: 12 }}>
                      *{errors.subject.message}
                    </ThemedText>
                  )}
                </>
              )}
            />

            {/* MESSAGE */}
            <Controller
              control={control}
              name="message"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="Message"
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5f5",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 10,
                      height: 100,
                      textAlignVertical: "top",
                      color: isDark ? "#fff" : "#000",
                    }}
                  />
                  {errors.message && (
                    <ThemedText style={{ color: "red", fontSize: 12 }}>
                      *{errors.message.message}
                    </ThemedText>
                  )}
                </>
              )}
            />

            {/* SUBMIT */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              style={{ borderRadius: 12, marginTop: 16 }}
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
                  Submit
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
