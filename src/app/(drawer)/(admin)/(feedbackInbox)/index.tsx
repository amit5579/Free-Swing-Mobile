import React, { useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";


import { ThemedView } from "@/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedbackInboxPage() {
  const router = useRouter();
    const [activeTab, setActiveTab] = useState("All");
   const tabs = [
    { key: "All", label: "All", icon: "grid-outline" },
    { key: "statistics", label: "Player Statistics", icon: "people-outline" },
  ];
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

          <VStack className="flex-1 p-4">
            {/* HEADER (FIXED) */}
            <HStack className="items-center justify-between mb-4">
              <Pressable onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#8bc34a" />
              </Pressable>

              <ThemedText style={{ fontSize: 20, fontWeight: "700" }}>
                Feedback Inbox
              </ThemedText>

              <View style={{ width: 24 }} />
            </HStack>


            {/* CONTENT */}
            <ScrollView showsVerticalScrollIndicator={false}>
             
            </ScrollView>
          </VStack>
        </SafeAreaView>
      </ThemedView>
    </>
  );
}
