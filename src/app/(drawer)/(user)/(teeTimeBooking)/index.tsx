import React, { useState } from "react";
import { StyleSheet } from "react-native";
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

export default function TeeTimeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

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
          <VStack className="px-4 pt-5 pb-20"></VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ---------- COURSE CARD ---------- */
