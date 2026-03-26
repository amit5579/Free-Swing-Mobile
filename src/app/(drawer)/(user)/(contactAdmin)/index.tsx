import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
  TextInput,
  FlatList,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
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

import { Dropdown } from "react-native-element-dropdown";
import { getFeedbackHistory, sendFeedback } from "@/api/admin/feedback";

export default function ContactAdminPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // Dummy feedback history (replace with API)
  const [feedbacks, setFeedbacks] = useState<any[]>([
    // {
    //   id: "1",
    //   category: "bug",
    //   status: "open",
    //   subject: "bugchecktest",
    //   message: "testing the contact admin flow with bug category.",
    //   date: "Mar 25, 2026",
    // },
  ]);

  // FORM
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactAdminType>({
    resolver: zodResolver(contactAdminSchema),
  });

  const fetchFeedback = async () => {
    try {
      const response = await getFeedbackHistory();
      setFeedbacks(response);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const onSubmit = async (data: ContactAdminType) => {

   await sendFeedback(data.category, data.subject,data.message)
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
  const RenderHeader = () => (
    <HStack className="px-3 pt-5 items-center justify-between">
      <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
        <Ionicons
          name="arrow-back-outline"
          size={22}
          color={isDark ? "#fff" : "#020617"}
        />
      </Pressable>

      <ThemedText
        style={{
          flex: 1,
          fontSize: 20,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        Contact Admin
      </ThemedText>

      <View style={{ width: 40 }} />
    </HStack>
  );

  const renderFeedbackItem = ({ item }: any) => (
    <Box
      className="p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: isDark
          ? "rgba(30, 41, 59, 0.5)"
          : "rgba(241, 245, 249, 0.6)",
      }}
    >
      <HStack className="items-center justify-between mb-2">
        <ThemedText style={{ fontWeight: "600" }}>{item.subject}</ThemedText>

        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            backgroundColor: "#facc15",
          }}
        >
          <ThemedText style={{ fontSize: 12 }}>{item.status}</ThemedText>
        </View>
      </HStack>

      <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
        {formatDateTime(item.createdAt)}
      </ThemedText>

      <ThemedText style={{ marginTop: 6 }}>{item.message}</ThemedText>
    </Box>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RenderHeader />
      <Watermark />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="px-4 pt-5 pb-20">
          {/* BUTTON */}
          <Pressable
            onPress={() => setModalVisible(true)}
            className="mb-4 p-4 rounded-xl items-center"
            style={{
              backgroundColor: "#84cc16",
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              + Send Feedback
            </ThemedText>
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

            <HStack className="justify-end mb-3 ">
              <Box className="border border-gray-400 rounded-full px-3 py-1">
                <ThemedText>
                  {feedbacks.length}
                  {feedbacks.length == 1 ? "item" : "items"}
                </ThemedText>
              </Box>
            </HStack>
          </VStack>

          {feedbacks.length === 0 ? (
            <VStack
              className="items-center justify-center mt-10"
              style={{
                paddingVertical: 40,
                borderRadius: 16,
                backgroundColor: isDark ? "#020617" : "#f8fafc",
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
                You haven’t submitted any feedback yet. Tap on{" "}
                <ThemedText style={{ fontWeight: "600" }}>
                  “Send Feedback”
                </ThemedText>{" "}
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
              backgroundColor: isDark ? "#020617" : "#ffffff",
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
                      data={[
                        { label: "Bug", value: "bug" },
                        { label: "Improvement", value: "improvement" },
                        { label: "General", value: "general" },
                      ]}
                      labelField="label"
                      valueField="value"
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
              style={{
                backgroundColor: "#84cc16",
                padding: 14,
                borderRadius: 12,
                marginTop: 16,
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Submit
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
