import { ScrollView } from "react-native-gesture-handler";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
import { Ionicons } from "@expo/vector-icons";

import { useColorScheme, Text, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { HStack } from "@/components/hstack";
import { Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";

export default function EditHolesPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const routePage = useRouter();

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        {/* HEADER */}
        <HStack
          className="px-3 pt-5 pb-3 items-center"
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
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Edit Holes
          </ThemedText>

          {/* RIGHT: Spacer */}
          <View style={{ width: 34 }} />
        </HStack>

        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={{ color: isDark ? "#fff" : "#000" }}>Holes Page</Text>
        </ScrollView>
      </ThemedView>
    </>
  );
}
