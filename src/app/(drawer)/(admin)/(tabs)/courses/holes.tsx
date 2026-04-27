import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import {
  useColorScheme,
  Text,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HStack } from "@/components/hstack";
import { Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useEffect as useReactEffect } from "react";
import { getHolesByTeeBox, updateHoles } from "@/api/admin/courses";
import { VStack } from "@/components/vstack";
import { Box } from "@/components/box";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";

export default function EditHolesPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { teeBoxId } = useLocalSearchParams();
  const routePage = useRouter();

  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  //  FETCH DATA
  const fetchHoles = async () => {
    try {
      setLoading(true);
      const response = await getHolesByTeeBox(teeBoxId as string);

      // IMPORTANT: make editable copy
      const formatted = response.map((item: any) => ({
        ...item,
        par: String(item.par),
        strokeIndex: String(item.strokeIndex),
        yardage: String(item.yardage),
      }));

      setHoles(formatted);
    } catch (error) {
      console.error("Error fetching holes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoles();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      for (const hole of holes) {
        await updateHoles(
          hole.strokeIndex,
          hole.holeId,
          hole.holeNumber,
          hole.par,
          teeBoxId as string,
          hole.yardage
        );
      }
      Toast.show({
        type: "success",
        text1: "Holes updated successfully",
      });
    fetchHoles();
    } catch (error) {
      console.error("Error saving holes:", error);
       Toast.show({
        type: "error",
        text1: "Failed to update Holes",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE INPUT CHANGE (SIMPLE)
  const updateField = (index: number, field: string, value: string) => {
    const updated = [...holes];
    updated[index][field] = value;
    setHoles(updated);
  };


  const HoleCardSkeleton = ({ isDark }: { isDark: boolean }) => {
  return (
    <Box
      className="p-4 rounded-xl"
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
        marginBottom: 12,
      }}
    >
      <VStack>
        {/* Title */}
        <Skeleton
          isDark={isDark}
          height={14}
          width="30%"
          style={{ marginBottom: 10 }}
        />

        {/* Inputs Row */}
        <HStack style={{ justifyContent: "space-between" }}>
          {[1, 2, 3].map((_, i) => (
            <View key={i} style={{ width: "30%" }}>
              {/* Label */}
              <Skeleton
                isDark={isDark}
                height={10}
                width="60%"
                style={{ marginBottom: 6 }}
              />

              {/* Input Box */}
              <Skeleton
                isDark={isDark}
                height={36}
                borderRadius={8}
              />
            </View>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
};

const renderHeader = () => (
  <HStack
    style={{
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark ? "#020617" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
    }}
  >
    {/* 🔙 BACK BUTTON */}
    <Pressable
      onPress={() => routePage.back()}
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
    <VStack style={{ flex: 1, alignItems: "center" }}>

      <ThemedText
        style={{
          fontSize: 17,
          fontWeight: "700",
          marginTop: 2,
          color: isDark ? "#fff" : "#020617",
        }}
      >
        Edit Holes
      </ThemedText>
    </VStack>

    {/* ⚖️ RIGHT SPACER (MATCHES BACK BUTTON WIDTH) */}
    <View style={{ width: 40 }} />
  </HStack>
);

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* HEADER */}
      {renderHeader()}

      <Watermark />

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
       {loading ? (
    <>
      {Array.from({ length: 9 }).map((_, i) => (
        <HoleCardSkeleton key={i} isDark={isDark} />
      ))}
    </>
  ) : (
     <>{holes.map((hole, index) => (
              <Box
                key={hole.holeId}
                className="p-4 rounded-xl border border-neutral-200 mb-3"
                style = {{ backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",}}
              >
                <VStack space="sm">
                  {/* Hole Title */}
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 14,
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    Hole {hole.holeNumber}
                  </Text>

                  {/* Row */}
                  <HStack
                    style={{
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}
                  >
                    {/* PAR */}
                    <View style={{ width: "30%" }}>
                      <ThemedText style={{ fontSize: 11, marginBottom: 4 }}>
                        Par
                      </ThemedText>
                      <TextInput
                        value={hole.par}
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          updateField(index, "par", text)
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: "#e5e5e5",
                          borderRadius: 8,
                          padding: 8,
                          textAlign: "center",
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                    </View>

                    {/* strokeIndex */}
                    <View style={{ width: "30%" }}>
                      <ThemedText style={{ fontSize: 11, marginBottom: 4 }}>
                        Stroke Index
                      </ThemedText>
                      <TextInput
                        value={hole.strokeIndex}
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          updateField(index, "strokeIndex", text)
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: "#e5e5e5",
                          borderRadius: 8,
                          padding: 8,
                          textAlign: "center",
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                    </View>

                    {/* YARDAGE */}
                    <View style={{ width: "30%" }}>
                      <ThemedText style={{ fontSize: 11, marginBottom: 4 }}>
                        Yardage
                      </ThemedText>
                      <TextInput
                        value={hole.yardage}
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          updateField(index, "yardage", text)
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: "#e5e5e5",
                          borderRadius: 8,
                          padding: 8,
                          textAlign: "center",
                          color: isDark ? "#fff" : "#000",
                        }}
                      />
                    </View>
                  </HStack>
                </VStack>
              </Box>
            ))}</>)}
            

            {/* SAVE BUTTON */}
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: "#8BC34A",
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Save Changes
              </Text>
            </Pressable>
      </ScrollView>
    </ThemedView>
  );
}