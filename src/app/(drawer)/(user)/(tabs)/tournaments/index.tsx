import React, { useState } from "react";
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  View,
  Text,
  Button,
  TextInput,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { HStack } from "@/components/hstack";
import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Dropdown } from "react-native-element-dropdown";
import { useRouter } from "expo-router";

const tournaments = [
  {
    id: 1,
    name: "test tour 1",
    start: "Feb 24, 2026",
    end: "Feb 26, 2026",
    description: "No description",
    playable: true,
  },
  {
    id: 2,
    name: "budies play",
    start: "Feb 26, 2026",
    end: "Feb 26, 2026",
    description: "No description",
  },
  {
    id: 3,
    name: "bmw",
    start: "Mar 11, 2026",
    end: "Mar 12, 2026",
    description: "No description",
    playable: true,
  },
];

const courseData = [
  { label: "Pebble Beach", value: "1" },
  { label: "Augusta National", value: "2" },
  { label: "St Andrews", value: "3" },
  { label: "Royal Melbourne", value: "4" },
];
const teeBoxData = [
  { label: "White Tee", value: "1" },
  { label: "Blue Tee", value: "2" },
  { label: "Black Tee", value: "3" },
  { label: "Gold Tee", value: "4" },
];

const scoringData = [
  { label: "Standard (Gross/Net)", value: "1" },
  { label: "Stableford", value: "2" },
  { label: "Match Play", value: "3" },
];

const playersData = [
  { label: "4 Players", value: "4" },
  { label: "8 Players", value: "8" },
  { label: "12 Players", value: "12" },
  { label: "16 Players", value: "16" },
];

export default function TournamentsScreen() {

      const routePage = useRouter();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tModalVisible, setTModalVisible] = useState(false);
  const [courseValue, setCourseValue] = useState(null);
  const [teeBoxValue, setTeeBoxValue] = useState(null);
  const [scoringValue, setScoringValue] = useState(null);
  const [playersValue, setPlayersValue] = useState(null);


  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.safeArea}>
          <Watermark />

          {/* Header */}
          <HStack className="justify-between items-center mt-3">
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Tournaments
            </ThemedText>

            <Pressable
              style={styles.createButton}
              onPress={() => setTModalVisible(true)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-outline" size={28} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Create Mini Tournament
              </ThemedText>
            </Pressable>
          </HStack>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {tournaments.map((tournament) => (
              <Box key={tournament.id} style={styles.card}>
                <ThemedText style={styles.title}>{tournament.name}</ThemedText>

                <ThemedText style={styles.description}>
                  {tournament.description}
                </ThemedText>

                {/* Dates */}

                <HStack className="justify-between mt-2">
                  <VStack>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      Start
                    </ThemedText>

                    <ThemedText>{tournament.start}</ThemedText>
                  </VStack>

                  <VStack>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      End
                    </ThemedText>

                    <ThemedText>{tournament.end}</ThemedText>
                  </VStack>
                </HStack>
                {/* Leaderboard */}
                <Pressable 
                onPress={() => routePage.push("/tournaments/leaderboardUser")}
                className="flex-row justify-center items-center gap-2 border border-[#f59e0b] p-2 rounded-lg">
                  <Ionicons
                    name="stats-chart-outline"
                    size={23}
                    color="#f59e0b"
                  />

                  <ThemedText style={styles.outlineButtonText2}>
                    View Leaderboard
                  </ThemedText>
                </Pressable>

                {/* History */}
                <Pressable 
                onPress={() => routePage.push("/tournaments/scoreCardUser")}
                className="flex-row justify-center items-center gap-2 border border-[#06b6d4] p-2 rounded-lg">
                  <Ionicons name="time-outline" size={23} color="#06b6d4" />

                  <ThemedText style={styles.outlineButtonText}>
                    My History
                  </ThemedText>
                </Pressable>

                {/* Play Button */}
                {tournament.playable && (
                  <Pressable
                    onPress={() => setModalVisible(true)}
                    className="flex-row justify-center items-center gap-2  bg-[#8bc34a] p-2 rounded-lg"
                  >
                    <Ionicons name="play" size={23} color="white" />

                    <ThemedText style={styles.playText}>Play</ThemedText>
                  </Pressable>
                )}
              </Box>
            ))}
          </ScrollView>
        </ThemedView>
      </ThemedView>
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* HEADER */}
            <HStack style={styles.header}>
              <Text style={styles.headerTitle}>
                IMPORTANT – LEGAL AGREEMENT
              </Text>
            </HStack>

            {/* BASIC INFO */}
            <VStack style={styles.infoBox}>
              <Text>
                <Text style={styles.bold}>Tournament Name:</Text> BMW
              </Text>
              <Text>
                <Text style={styles.bold}>Organized By:</Text> KOLVE18FREESWING
                LLP
              </Text>
              <Text>
                <Text style={styles.bold}>Effective Date:</Text> Auto-generated
                upon acceptance
              </Text>
            </VStack>

            {/* WARNING BOX */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Before completing your tournament registration, you must read
                and agree to this Liability Waiver.
              </Text>
            </View>

            {/* WAIVER CONTENT */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>1. Assumption of Risk</Text>
                <Text style={styles.sectionText}>
                  I understand that participation in golf tournaments involves
                  inherent risks including injury, collisions, equipment hazards
                  and weather related risks.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>
                  2. Medical Fitness Declaration
                </Text>
                <Text style={styles.sectionText}>
                  I declare that I am medically fit to participate in this
                  tournament.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>3. Release of Liability</Text>
                <Text style={styles.sectionText}>
                  I release the organizers and sponsors from any liability
                  related to injuries, damages or losses arising from my
                  participation.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>4. Indemnity</Text>
                <Text style={styles.sectionText}>
                  I agree to indemnify the organizers against claims arising
                  from my participation.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>
                  5. Compliance With Rules
                </Text>
                <Text style={styles.sectionText}>
                  I will comply with tournament rules and play fairly.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>6. Personal Property</Text>
                <Text style={styles.sectionText}>
                  The organizer is not responsible for lost or stolen property.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>
                  7. Weather & Event Changes
                </Text>
                <Text style={styles.sectionText}>
                  The organizer may reschedule or cancel events due to weather
                  or safety concerns.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>
                  8. Photography & Media Consent
                </Text>
                <Text style={styles.sectionText}>
                  I grant permission to use images or videos from the tournament
                  for promotional use.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>
                  9. Digital Scoring & Data Use
                </Text>
                <Text style={styles.sectionText}>
                  I agree that scores and tournament data may be stored
                  digitally.
                </Text>
              </VStack>

              <VStack style={styles.section}>
                <Text style={styles.sectionTitle}>10. Governing Law</Text>
                <Text style={styles.sectionText}>
                  This agreement is governed by the laws of India.
                </Text>
              </VStack>
            </ScrollView>

            {/* DIGITAL ACCEPTANCE */}
            <View style={styles.acceptanceBox}>
              <Text style={styles.acceptanceTitle}>DIGITAL ACCEPTANCE</Text>

              {/* MINOR CHECKBOX */}
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsMinor(!isMinor)}
              >
                <View
                  style={[styles.checkbox, isMinor && styles.checkboxActive]}
                />
                <Text style={styles.checkboxText}>
                  I am under 18 years of age
                </Text>
              </Pressable>

              {/* GUARDIAN FORM */}
              {isMinor && (
                <VStack style={styles.guardianForm}>
                  <Text style={styles.formTitle}>
                    Parent / Guardian Details
                  </Text>

                  <TextInput placeholder="Name" style={styles.input} />

                  <TextInput
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />

                  <TextInput placeholder="Relation" style={styles.input} />
                </VStack>
              )}

              {/* ACCEPT CHECKBOX */}
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setAccepted(!accepted)}
              >
                <View
                  style={[styles.checkbox, accepted && styles.checkboxActive]}
                />
                <Text style={styles.checkboxText}>
                  I confirm I have read and understood the waiver
                </Text>
              </Pressable>
              {/* ACCEPT CHECKBOX */}
              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  setAccepted(!accepted);
                }}
              >
                <View
                  style={[styles.checkbox, accepted && styles.checkboxActive]}
                />
                <Text style={styles.checkboxText}>
                  I agree to the terms above.
                </Text>
              </Pressable>
            </View>

            {/* ACTION BUTTONS */}
            <HStack style={styles.buttonRow}>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                }}
                style={styles.declineBtn}
              >
                <Text style={{ color: "#e53935" }}>DECLINE</Text>
              </Pressable>

              <Pressable style={styles.acceptBtn}>
                <Text style={{ color: "#fff" }}>I AGREE & REGISTER</Text>
              </Pressable>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Create mini tournament modal */}
      <Modal animationType="slide" transparent visible={tModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* HEADER */}
              <HStack className="justify-between items-center mb-4">
                <ThemedText
                  style={{ fontSize: 18, fontWeight: "700", lineHeight: 27 }}
                >
                  Create Mini Tournament
                </ThemedText>

                <Pressable
                onPress={() => setTModalVisible(false)}
                 >
                  <Ionicons name="close" size={22} />
                </Pressable>
              </HStack>
              {/* TOURNAMENT NAME */}
              <Text style={styles.label}>Tournament Name</Text>
              <TextInput placeholder="e.g. Weekend Cup" style={styles.input} />

              {/* DATE ROW */}
              <HStack style={styles.row}>
                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>Start Date</Text>

                  <Pressable
                    style={styles.input}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text>{startDate.toDateString()}</Text>
                  </Pressable>
                </VStack>

                <VStack style={{ flex: 1 }}>
                  <Text style={styles.label}>End Date</Text>

                  <Pressable
                    style={styles.input}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text>{endDate.toDateString()}</Text>
                  </Pressable>
                </VStack>
              </HStack>

              {/* COURSE */}
              <Text style={styles.label}>Course</Text>
              <Dropdown
                style={styles.dropdown}
                placeholder="Select Course"
                data={courseData}
                labelField="label"
                valueField="courseValue"
                value={courseValue}
                onChange={(item) => setCourseValue(item.value)}
              />

              {/* TEE BOX */}
              <Text style={styles.label}>Tee Box</Text>
              <Dropdown
                style={styles.dropdown}
                placeholder="Select Tee Box"
                data={teeBoxData}
                labelField="label"
                valueField="value"
                value={teeBoxValue}
                onChange={(item) => setTeeBoxValue(item.value)}
              />

              {/* SCORING TYPE */}
              <Text style={styles.label}>Scoring Type</Text>
              <Dropdown
                style={styles.dropdown}
                placeholder="Select Scoring Type"
                data={scoringData}
                labelField="label"
                valueField="value"
                value={scoringValue}
                onChange={(item) => setScoringValue(item.value)}
              />

              {/* MAX PLAYERS */}
              <Text style={styles.label}>Max Players</Text>
              <Dropdown
                style={styles.dropdown}
                placeholder="Select Max Players"
                data={playersData}
                labelField="label"
                valueField="value"
                value={playersValue}
                onChange={(item) => setPlayersValue(item.value)}
              />
            </ScrollView>

            {/* BUTTONS */}
            <HStack style={styles.buttonRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setTModalVisible(false)}
              >
                <Text>Cancel</Text>
              </Pressable>

              <Pressable style={styles.createBtn}>
                <Text style={{ color: "#fff" }}>Create Tournament</Text>
              </Pressable>
            </HStack>
          </View>
        </View>

        {/* START DATE PICKER */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {/* END DATE PICKER */}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.two,
    maxWidth: MaxContentWidth,
  },
  createButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  list: {
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },

  card: {
    borderRadius: 14,
    padding: Spacing.four,
    gap: Spacing.two,
    borderColor: "#8bc34a",
    borderWidth: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  description: {
    opacity: 0.6,
  },

  dateRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },

  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  dateText: {
    fontSize: 12,
  },

  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
  },

  secondaryButtonText: {
    fontWeight: "500",
  },

  outlineButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: Spacing.two,
    borderWidth: 1,
  },

  outlineButtonText: {
    fontWeight: "500",
    color: "#06b6d4",
  },
  outlineButtonText2: {
    fontWeight: "500",
    color: "#f59e0b",
  },

  playText: {
    color: "white",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 10,
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    maxHeight: "90%",
  },

  header: {
    justifyContent: "center",
    marginBottom: 10,
  },

  headerTitle: {
    fontWeight: "700",
    fontSize: 19,
    color: "#dc3545",
  },

  infoBox: {
    marginBottom: 10,
  },

  bold: {
    fontWeight: "600",
  },

  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  warningText: {
    color: "#854d0e",
    fontWeight: "500",
  },

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontWeight: "600",
  },

  sectionText: {
    fontSize: 13,
    color: "#555",
  },

  acceptanceBox: {
    marginTop: 10,
  },

  acceptanceTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#999",
    marginRight: 10,
    borderRadius: 4,
  },

  checkboxActive: {
    backgroundColor: "#8bc34a",
  },

  checkboxText: {
    flex: 1,
  },

  guardianForm: {
    marginBottom: 10,
  },

  formTitle: {
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },

  buttonRow: {
    justifyContent: "space-between",
    marginTop: 10,
  },

  declineBtn: {
    borderWidth: 1,
    borderColor: "#e53935",
    padding: 10,
    borderRadius: 5,
  },

  acceptBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 10,
  },

  row: {
    gap: 10,
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },

  createBtn: {
    backgroundColor: "#8bc34a",
    padding: 10,
    borderRadius: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginTop: 6,
  },
});
