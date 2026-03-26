import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { getCourse } from "@/api/admin/courses";

export default function TeeTimeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [activeTab, setActiveTab] = useState("tee1");

  const [course, setCourse] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const tabs = [
    { key: "tee1", label: "Tee1", icon: "grid-outline" },
    { key: "tee10", label: "Tee10", icon: "people-outline" },
  ];

  const fetchTeeTiming = async () => {
    try {
      const courseResponse = await getCourse();
      setCourse(courseResponse);
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    }
  };

  const RenderHeader = () => {
    return (
      <>
        <HStack
          className="px-3 pt-5 items-center"
          style={{ justifyContent: "space-between" }}
        >
          {/* LEFT: Back button */}
          <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={colorScheme === "dark" ? "#ffffff" : "#020617"}
            />
          </Pressable>

          {/* CENTER: Title */}
          <ThemedText
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Tee time booking
          </ThemedText>

          {/* RIGHT: Add Button */}
          <View style={{ width: 40 }} />
        </HStack>
      </>
    );
  };


  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        {/* HEADER */}
        <RenderHeader />
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-5 pb-20">
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
                    <Ionicons
                      name="golf-outline"
                      size={16}
                      color={active ? "#fff" : isDark ? "#aaa" : "#6b7280"}
                      className="mr-1"
                    />
                    <Text
                      className={`text-sm font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>


            {activeTab === "tee1" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedText>Tee1</ThemedText>
              </ScrollView>
            )}

            {activeTab === "tee10" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedText>Tee10</ThemedText>
              </ScrollView>
            )}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ---------- COURSE CARD ---------- */
