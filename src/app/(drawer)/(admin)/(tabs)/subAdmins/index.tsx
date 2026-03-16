import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  Text,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Divider } from "@/components/divider";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";

export default function subAdminsPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [modalVisible, setModalVisible] = useState(false);

  // Dummy data (can be replaced with API later)
  const subAdmins = [
    {
      id: 1,
      name: "ASC AEPTA",
      email: "asc@mail.com",
      mobile: "987766554",
      courses: ["ASC AEPTA"],
      players: 4,
    },
    {
      id: 2,
      name: "Rahul Sharma",
      email: "rahul@mail.com",
      mobile: "989898989",
      courses: ["Delhi Golf Club"],
      players: 7,
    },
  ];

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        <Watermark />

        {/* Header */}
        <HStack className="justify-between items-center px-4 my-3">
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Sub Admins
          </ThemedText>

          <Pressable
            onPress={() => setModalVisible(true)}
            className="flex-row items-center gap-1"
            style={styles.createButton}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />

            <ThemedText style={{ color: "white", fontWeight: "600" }}>
              Create Sub-Admins
            </ThemedText>
          </Pressable>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pb-20 mt-4 gap-4">
            {subAdmins.map((admin) => (
              <SubAdminCard key={admin.id} admin={admin} isDark={isDark} setModalVisible={setModalVisible} />
            ))}
          </VStack>
        </ScrollView>
      </ThemedView>

      {/* CREATE SUB ADMIN MODAL */}
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
              <Text className="text-xl font-bold">
                Create Sub Admin
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} />
              </Pressable>
            </HStack>

            {/* FORM */}
            <VStack className="gap-3">
              <TextInput placeholder="Full name" style={styles.input} />

              <TextInput placeholder="Email" style={styles.input} />

              <TextInput placeholder="Phone number" style={styles.input} />

              <TextInput
                placeholder="Set password"
                secureTextEntry
                style={styles.input}
              />

              <TextInput placeholder="Assign courses" style={styles.input} />
            </VStack>

            {/* Buttons */}
            <HStack className="justify-end mt-6 gap-3">
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={{ color: "#374151" }}>Cancel</ThemedText>
              </Pressable>

              <Pressable style={styles.createButton}>
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Create
                </ThemedText>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SubAdminCard({ admin, isDark, setModalVisible }: any) {
  return (
    <Box
      className="rounded-2xl p-4"
      style={{
        borderWidth: 1,
        borderColor: isDark ? "#262626" : "#e5e5e5",
      }}
    >
      <VStack className="gap-2">
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {admin.name}
        </ThemedText>

        <ThemedText style={{ opacity: 0.7 }}>{admin.email}</ThemedText>

        <ThemedText style={{ opacity: 0.7 }}>{admin.mobile}</ThemedText>

        {/* Courses */}
        <HStack className="items-center mt-2 gap-2">
          <ThemedText style={{ fontWeight: "600" }}>Courses:</ThemedText>

          <Box style={styles.courseBadge}>
            <ThemedText style={{ color: "#8bc34a", fontSize: 12 }}>
              {admin.courses[0]}
            </ThemedText>
          </Box>
        </HStack>

        {/* Players */}
        <HStack className="items-center mt-2 gap-2">
          <ThemedText style={{ fontWeight: "600" }}>Players:</ThemedText>

          <Box style={styles.playerBadge}>
            <ThemedText style={{ color: "#8bc34a" }}>
              {admin.players}
            </ThemedText>
          </Box>
        </HStack>

        <Divider className="my-2" />

        {/* Actions */}
        <HStack className="justify-between">
          <Pressable
          onPress={() => setModalVisible(true)}
          className="flex-row items-center gap-1">
            <Ionicons name="pencil-outline" size={16} color="#3b82f6" />

            <ThemedText style={{ color: "#3b82f6" }}>Edit</ThemedText>
          </Pressable>

          <Pressable className="flex-row items-center gap-1">
            <Ionicons name="trash-outline" size={16} color="#ef4444" />

            <ThemedText style={{ color: "#ef4444" }}>Delete</ThemedText>
          </Pressable>
        </HStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
  },

  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  courseBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  playerBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});