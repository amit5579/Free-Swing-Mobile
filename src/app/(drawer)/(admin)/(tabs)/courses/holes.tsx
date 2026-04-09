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

export default function EditHolesPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { teeBoxId } = useLocalSearchParams();
  const routePage = useRouter();

  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH DATA
  const fetchHoles = async () => {
    try {
      setLoading(true);
      const response = await getHolesByTeeBox(teeBoxId as string);

      // IMPORTANT: make editable copy
      const formatted = response.map((item: any) => ({
        ...item,
        par: String(item.par),
        handicap: String(item.handicap),
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
          hole.handicap,
          hole.holeId,
          hole.holeNumber,
          hole.par,
          teeBoxId as string,
          hole.yardage
        );
      }
    fetchHoles();
    } catch (error) {
      console.error("Error saving holes:", error);
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
  return (
    <ThemedView style={{ flex: 1 }}>
      {/* HEADER */}
      <HStack
        className="px-3 pt-5 pb-3 items-center"
        style={{ justifyContent: "space-between" }}
      >
        <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={isDark ? "#ffffff" : "#020617"}
          />
        </Pressable>

        <ThemedText
          style={{
            flex: 1,
            fontSize: 22,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Edit Holes
        </ThemedText>

        <View style={{ width: 34 }} />
      </HStack>

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
                      <Text style={{ fontSize: 11, marginBottom: 4 }}>
                        Par
                      </Text>
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

                    {/* HANDICAP */}
                    <View style={{ width: "30%" }}>
                      <Text style={{ fontSize: 11, marginBottom: 4 }}>
                        Handicap
                      </Text>
                      <TextInput
                        value={hole.handicap}
                        keyboardType="numeric"
                        onChangeText={(text) =>
                          updateField(index, "handicap", text)
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
                      <Text style={{ fontSize: 11, marginBottom: 4 }}>
                        Yardage
                      </Text>
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