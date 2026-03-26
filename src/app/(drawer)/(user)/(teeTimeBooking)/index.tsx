import React, { useEffect, useState } from "react";
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
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import {
  bookSeat,
  cancelSeatBooking,
  getSubAdminCourses,
  getTeeTimeSeats,
} from "@/api/teeTime";

export default function TeeTimeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const [activeTeeTab, setActiveTeeTab] = useState(1);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [teeData, setTeeData] = useState<any>(null);
  const [localBookedSeats, setLocalBookedSeats] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const getSeatKey = (timeSlot: string, seatNumber: number) =>
    `${timeSlot}-${seatNumber}`;

  const tabs = [
    { key: 1, label: "Tee1", icon: "grid-outline" },
    { key: 10, label: "Tee10", icon: "people-outline" },
  ];

  const fetchTeeTiming = async () => {
    try {
      const courseResponse = await getSubAdminCourses();
      const teeDetails = await getTeeTimeSeats(
        availableDates[selectedDateIndex],
        activeTeeTab,
      );
      setTeeData(teeDetails); // ✅ IMPORTANT

      // console.log("teeDetails", teeDetails);
      // Map courses to { label, value } for the dropdown
      const formattedCourses = courseResponse.map((c: any) => ({
        label: c.name || `Course ${c.courseId}`,
        value: c.courseId,
      }));
      setCourses(formattedCourses);
      if (formattedCourses.length > 0) {
        setSelectedCourse(formattedCourses[0].value);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    } finally {
      setLoading(false);
    }
  };

  // export const bookSeat = async (courseId: number, date: string, seatNumber: number, tee: number, timeSlot: string) => {

  const bookSeatHandler = async (timeSlot: string, seatNumber: number) => {
    try {
      await bookSeat(
        selectedCourse,
        availableDates[selectedDateIndex],
        seatNumber,
        activeTeeTab,
        timeSlot,
      );

      const key = getSeatKey(timeSlot, seatNumber);

      setLocalBookedSeats((prev: any) => ({
        ...prev,
        [key]: true, // 👈 instantly mark as mine
      }));

      fetchTeeTiming();
    } catch (error) {
      console.error(error);
    }
  };

  const cancelBookingHandler = async (
    bookingId: number,
    timeSlot: string,
    seatNumber: number,
  ) => {
    try {
      await cancelSeatBooking(bookingId);

      const key = getSeatKey(timeSlot, seatNumber);

      setLocalBookedSeats((prev: any) => {
        const updated = { ...prev };
        delete updated[key]; // 👈 remove from local state
        return updated;
      });

      fetchTeeTiming();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const today = new Date();
    const arr = [];

    for (let i = 0; i < 4; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      arr.push(formatDate(newDate));
    }

    setAvailableDates(arr);
  }, []);

  useEffect(() => {
    if (availableDates.length > 0) {
      fetchTeeTiming();
    }
  }, [availableDates, selectedDateIndex, activeTeeTab, selectedCourse]);

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

  const TeeRow = ({ slot }: any) => {
    return (
      <Box
        style={{
          marginBottom: 16,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#ffffff",
          // backgroundColor: isDark ? "#1e293b" : "#ffffff",
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.2 : 0.05,
          // borderRadius: 6,
          // elevation: 2,
        }}
      >
        {/* Time Header */}
        <HStack
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#fff" : "#111",
            }}
          >
            {slot.time}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#6b7280",
            }}
          >
            {slot.seats?.length} slots
          </Text>
        </HStack>

        {/* Seats */}
        <HStack
          style={{
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {slot.seats.map((seat: any, index: number) => {
            const isBooked = seat?.isBooked;

            const key = getSeatKey(slot.time, seat.seatNumber);
            const isMine = localBookedSeats[key] || seat?.isMyBooking;
            return (
              <Pressable
                key={seat.id ?? `${slot.time}-${index}`}
                onPress={() => {
                  const key = getSeatKey(slot.time, seat.seatNumber);
                  const isMine = localBookedSeats[key] || seat?.isMyBooking;

                  if (isMine && seat.bookingId) {
                    cancelBookingHandler(
                      seat.bookingId,
                      slot.time,
                      seat.seatNumber,
                    );
                  } else if (!isBooked) {
                    bookSeatHandler(slot.time, seat.seatNumber);
                  }
                }}
                disabled={isBooked && !isMine}
                style={{
                  width: "23%", // 👈 4 per row
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                  alignItems: "center",

                  backgroundColor: isMine
                    ? "#ef4444"
                    : isBooked
                      ? isDark
                        ? "#374151"
                        : "#e5e7eb"
                      : "#8BC34A",
                }}
              >
                <Ionicons
                  name={
                    isMine
                      ? "close-circle"
                      : isBooked
                        ? "checkmark-done-sharp"
                        : "add-circle-sharp"
                  }
                  size={20}
                  color={
                    isBooked && !isMine
                      ? isDark
                        ? "#9ca3af"
                        : "#6b7280"
                      : "#fff"
                  }
                  style={{ marginBottom: 4 }}
                />

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color:
                      isBooked && !isMine
                        ? isDark
                          ? "#9ca3af"
                          : "#6b7280"
                        : "#fff",
                  }}
                >
                  {/* {isMine ? "Cancel" : isBooked ? "Cancel" : "Book"} */}
                  {isMine ? "Cancel" : isBooked ? "Booked" : "Book"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color:
                      isBooked && !isMine
                        ? isDark
                          ? "#9ca3af"
                          : "#6b7280"
                        : "#fff",
                  }}
                >
                  Seat {seat.seatNumber}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </Box>
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
            {/* Date tabs */}
            <ThemedView
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(229, 231, 235, 0.6)",
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
              className="mb-6 rounded-xl"
            >
              <ThemedText
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 10,
                  color: isDark ? "#ffffff" : "#020617",
                  textAlign: "center",
                }}
              >
                Select Date
              </ThemedText>

              <HStack
                style={{
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                {availableDates.map((date: string, index: number) => {
                  const active = selectedDateIndex === index;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedDateIndex(index)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: active
                          ? "#8BC34A"
                          : isDark
                            ? "#1e293b"
                            : "#f3f4f6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: active
                            ? "#fff"
                            : isDark
                              ? "#cbd5f5"
                              : "#374151",
                        }}
                      >
                        {formatDateString(date)}
                      </Text>
                    </Pressable>
                  );
                })}
              </HStack>

              <HStack
                style={{
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <Dropdown
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 7,
                    borderColor: "#e5e5e5",
                    borderWidth: 1,
                    marginRight: 10,
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
                  data={courses}
                  labelField="label"
                  valueField="value"
                  placeholder="Select course"
                  value={selectedCourse}
                  onChange={(item) => {
                    setSelectedCourse(item.value);
                  }}
                />
                <Pressable
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: "#8BC34A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={fetchTeeTiming}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Pressable>
              </HStack>
            </ThemedView>

            {/* Tee tabs */}
            <HStack
              className="rounded-full p-1 mb-6"
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(229, 231, 235, 0.6)",
              }}
            >
              {tabs.map((tab) => {
                const active = activeTeeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      setActiveTeeTab(tab.key);
                    }}
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
                      className={`text-md font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>

            <Box>
              {teeData?.slots?.map((slot: any, index: any) => (
                <TeeRow key={slot.time} slot={slot} />
              ))}

              {teeData?.slots?.length === 0 && (
                <Text
                  style={{
                    textAlign: "center",
                    marginTop: 40,
                    color: isDark ? "#94a3b8" : "#6b7280",
                  }}
                >
                  No slots available
                </Text>
              )}
            </Box>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ---------- COURSE CARD ---------- */
