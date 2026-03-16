import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { Divider } from "@/components/divider";
import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { TextInput } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
export default function teeBoxPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const color = [
    { label: "Red", value: "red" },
    { label: "Blue", value: "blue" },
    { label: "Black", value: "black" },
    { label: "White", value: "white" },
    { label: "Gold", value: "gold" },
    { label: "Green", value: "green" },
    { label: "Silver", value: "silver" },
  ];

  const tees = [
    {
      id: 1,
      name: "Kala",
      color: "Black",
      rating: 50,
      slope: 130,
      location: "Bangalore",
      tees: 2,
      free: true,
    },
    {
      id: 2,
      name: "Neela",
      color: "Blue",
      rating: 55,
      slope: 120,
      location: "Delhi",
      tees: 4,
      free: false,
    },
    {
      id: 3,
      name: "Safed",
      color: "White",
      rating: 65,
      slope: 105,
      location: "Mumbai",
      tees: 3,
      free: true,
    },
    {
      id: 4,
      name: "Lal",
      color: "Red",
      rating: 72,
      slope: 110,
      location: "Mumbai",
      tees: 3,
      free: true,
    },
    {
      id: 5,
      name: "Hara",
      color: "Green",
      rating: 72,
      slope: 110,
      location: "Mumbai",
      tees: 3,
      free: true,
    },
    {
      id: 6,
      name: "Rajat",
      color: "Silver",
      rating: 72,
      slope: 110,
      location: "Mumbai",
      tees: 3,
      free: true,
    },
    {
      id: 7,
      name: "Sona",
      color: "Gold",
      rating: 72,
      slope: 110,
      location: "Mumbai",
      tees: 3,
      free: true,
    },
  ];

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
            Tee Boxes
          </ThemedText>

          {/* RIGHT: Spacer */}
          <View style={{ width: 34 }} />
        </HStack>
        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pb-20 mt-3">
            <VStack className="gap-4">
              {tees.map((tee) => (
                <TeeCardAdmin
                  key={tee.id}
                  tee={tee}
                  isDark={isDark}
                  openModal={() => setModalVisible(true)}
                />
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      </ThemedView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <HStack className="justify-between items-center mb-4">
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                Edit Tee Box
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            {/* Form */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <VStack className="mb-4">
                <Text
                  style={{ fontSize: 15, fontWeight: "500", marginBottom: 6 }}
                >
                  Name
                </Text>

                <TextInput
                  placeholder="Enter tee name"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
              </VStack>

              {/* Color */}
              <VStack className="mb-4">
                <Text
                  style={{ fontSize: 15, fontWeight: "500", marginBottom: 6 }}
                >
                  Color
                </Text>

                <TextInput
                  placeholder="Enter color"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
              </VStack>

              {/* Rating + Slope Row */}
              <HStack className="justify-between mb-4" style={{ gap: 10 }}>
                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>Rating</Text>

                  <TextInput
                    placeholder="Rating"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </VStack>

                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>Slope</Text>

                  <TextInput
                    placeholder="Slope"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </VStack>
              </HStack>

              {/* Color Dropdown */}
             

              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: "#818589",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 14,
                }}
                data={color}
                labelField="label"
                valueField="value"
                placeholder="Select color"
                value={selectedColor}
                onChange={(item) => setSelectedColor(item.value)}
              />

              <Text className="text-gray-500 mb-4">
                *Premium tees are only available to subscribed members.
              </Text>
            </ScrollView>

            {/* Footer */}
            <HStack className="justify-end mt-4 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedColor(null);
                  setModalVisible(false);
                }}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.startButton}
              >
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Save Changes
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------- tee CARD ---------- */

function TeeCardAdmin({ tee, isDark, openModal }: any) {
  const teeColors: Record<string, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    black: "#111827",
    white: "#f3f4f6",
    gold: "#d4af37",
    green: "#16a34a",
    silver: "#9ca3af",
  };
  const routePage = useRouter();

  return (
    <Box
      className="rounded-2xl p-5 relative"
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
      }}
    >
      {/* Color Badge */}
      {/* Color Badge */}
      {tee.color &&
        (() => {
          const bgColor =
            teeColors[tee.color.toLowerCase()] || (isDark ? "#111" : "#fff");

          const textColor =
            tee.color.toLowerCase() === "white" ? "#000" : "#fff";

          return (
            <Box
              className="absolute top-3 right-3 px-3 py-1 rounded-full"
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#262626" : "#e5e5e5",
                backgroundColor: bgColor,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: textColor,
                }}
              >
                {tee.color}
              </ThemedText>
            </Box>
          );
        })()}

      {/* tee Name */}
      <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
        {tee.color}
      </ThemedText>

      {/* Location */}
      <HStack className="items-center justify-between my-3">
        <VStack>
          <ThemedText>Rating</ThemedText>
          <ThemedText>{tee.rating}</ThemedText>
        </VStack>
        <VStack>
          <ThemedText>Slope</ThemedText>
          <ThemedText>{tee.slope}</ThemedText>
        </VStack>
      </HStack>

      {/*setup holes button */}
      <Pressable
        onPress={() => routePage.push("/courses/holes")}
        className="mt-3 rounded-xl py-2 items-center border border-[#8bc34a] flex-row justify-center gap-2"
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#8bc34a" : "transparent",
        })}
      >
        {({ pressed }) => (
          <>
            <Ionicons
              name={pressed ? "apps" : "apps-outline"}
              size={18}
              color={pressed ? "white" : "#8bc34a"}
            />
            <ThemedText
              style={{
                color: pressed ? "white" : "#8bc34a",
                fontWeight: "600",
              }}
            >
              Setup Holes
            </ThemedText>
          </>
        )}
      </Pressable>

      <Divider className="my-3 h-[1px] bg-[#e5e5e5]" />

      {/* Edit / Delete Actions */}
      <HStack className="justify-between">
        {/* Edit */}
        <Pressable onPress={openModal} className="flex-row items-center gap-1">
          <Ionicons name="pencil-outline" size={15} color="#6b7280" />
          <ThemedText style={{ color: "#6b7280", fontWeight: "400" }}>
            Edit
          </ThemedText>
        </Pressable>

        {/* Delete */}
        <Pressable className="flex-row items-center gap-1">
          <Ionicons name="trash-outline" size={15} color="#ef4444" />
          <ThemedText style={{ color: "#ef4444", fontWeight: "400" }}>
            Delete
          </ThemedText>
        </Pressable>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
  },

  selectBox: {
    borderWidth: 1,
    borderColor: "#8bc34a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },

  handicapCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },

  cancelButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  startButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#818589",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
  },
});
