import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, ScrollView, RefreshControl } from "react-native";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import {
  bookSeat,
  cancelSeatBooking,
  getSubAdminCourses,
  getTeeTimeSeats,
} from "@/api/modules/teeTime.api";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [loadingSeats, setLoadingSeats] = useState<any>({});

  const [userId, setUserId] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeeTiming();
    setRefreshing(false);
  }, [availableDates, selectedDateIndex, activeTeeTab, selectedCourse]);
  const getSeatKey = (
    date: string,
    teeBox: number,
    timeSlot: string,
    seatNumber: number,
  ) => `${date}-${teeBox}-${timeSlot}-${seatNumber}`;

  const tabs = [
    { key: 1, label: "Tee1", icon: "grid-outline" },
    { key: 10, label: "Tee10", icon: "people-outline" },
  ];

  const fetchTeeTiming = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);

      const courseResponse = await getSubAdminCourses();
      // console.log("courseResponse", courseResponse);

      const formattedCourses = courseResponse.map((c: any) => ({
        label: c.name || `Course ${c.courseId}`,
        value: c.courseId,
      }));

      setCourses(formattedCourses);

      let currentCourseId = selectedCourse;
      if (formattedCourses.length > 0 && !selectedCourse) {
        currentCourseId = formattedCourses[0].value;
        setSelectedCourse(currentCourseId);
      }

      if (currentCourseId) {
        const teeDetails = await getTeeTimeSeats(
          currentCourseId,
          availableDates[selectedDateIndex],
          activeTeeTab,
        );
        setTeeData(teeDetails); // ✅ IMPORTANT
      }
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(Number(id));
        }
      } catch (err) {
        console.error("Error fetching userId:", err);
      }
    };
    getUserId();
  }, []);

  // export const bookSeat = async (courseId: number, date: string, seatNumber: number, tee: number, timeSlot: string) => {

  const bookSeatHandler = async (timeSlot: string, seatNumber: number) => {
    const date = availableDates[selectedDateIndex];
    const teeBox = activeTeeTab;
    const key = getSeatKey(date, teeBox, timeSlot, seatNumber);

    if (loadingSeats[key]) return;

    // Validation: Check if user already has a booking for this day
    const hasBookingToday = teeData?.slots?.some((slot: any) =>
      slot.seats?.some((seat: any) => seat.isBooked && seat.userId === userId),
    );

    if (hasBookingToday) {
      Toast.show({
        type: "error",
        text1: "Booking Limit",
        text2: "You can book only one seat for one day.",
      });
      return;
    }

    setLoadingSeats((prev: any) => ({ ...prev, [key]: true }));

    try {
      await bookSeat(selectedCourse, date, seatNumber, teeBox, timeSlot);

      await fetchTeeTiming();
      Toast.show({
        type: "success",
        text1: "Seat Booked",
        text2: "Seat booked successfully",
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: "Booking failed",
      });
    } finally {
      setLoadingSeats((prev: any) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const cancelBookingHandler = async (
    bookingId: number,
    timeSlot: string,
    seatNumber: number,
  ) => {
    const date = availableDates[selectedDateIndex];
    const teeBox = activeTeeTab;
    const key = getSeatKey(date, teeBox, timeSlot, seatNumber);

    if (loadingSeats[key]) return;
    setLoadingSeats((prev: any) => ({ ...prev, [key]: true }));

    try {
      await cancelSeatBooking(bookingId);

      await fetchTeeTiming();
      Toast.show({
        type: "success",
        text1: "Booking Cancelled",
        text2: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Cancellation Failed",
        text2: "Booking cancellation failed",
      });
    } finally {
      setLoadingSeats((prev: any) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
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
      <Box
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
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
            <ThemedText
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#fff" : "#020617",
                paddingHorizontal: 8,
              }}
            >
              Tee Time Booking
            </ThemedText>

            {/* ⚖️ RIGHT SPACER */}
            <View style={{ width: 40 }} />
          </HStack>

          {/* 📌 SUBTITLE */}
          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              // marginTop: 6,
              textAlign: "center",
            }}
          >
            Schedule and manage tee time slots
          </ThemedText>
        </VStack>
      </Box>
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
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
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

            const date = availableDates[selectedDateIndex];
            const teeBox = activeTeeTab;
            const key = getSeatKey(date, teeBox, slot.time, seat.seatNumber);
            const isMine = seat?.userId === userId;
            const isLoading = loadingSeats[key];

            return (
              <Pressable
                key={seat.id ?? `${slot.time}-${index}`}
                onPress={() => {
                  if (isLoading) return;

                  if (isBooked) {
                    if (isMine && seat.bookingId) {
                      cancelBookingHandler(
                        seat.bookingId,
                        slot.time,
                        seat.seatNumber,
                      );
                    }
                    //  else if (!isMine) {
                    //   Toast.show({
                    //     type: "error",
                    //     text1: "Cannot Cancel",
                    //     text2: "You don't have permission to cancel this booking.",
                    //   });
                    // }
                  } else {
                    bookSeatHandler(slot.time, seat.seatNumber);
                  }
                }}
                disabled={isLoading}
                style={{
                  width: "23%", // 👈 4 per row
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                  alignItems: "center",
                  backgroundColor: isBooked
                    ? isMine
                      ? "#ef4444"
                      : "grey"
                    : "#8BC34A",
                  // opacity: isLoading ? 0.6 : 1,
                }}
              >
                {/*  {isLoading
                    ? "Please wait"
                    : isBooked
                      ? isMine
                        ? "Cancel booking"
                        : seat.userName || "Booked"
                      : "Book"} */}
                <Ionicons
                  name={
                    isLoading
                      ? "hourglass-outline"
                      : isBooked
                        ? isMine
                          ? "close-circle"
                          : "person"
                        : "add-circle-sharp"
                  }
                  size={20}
                  color="#fff"
                  style={{ marginBottom: 4 }}
                />

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  {isLoading
                    ? "Please wait"
                    : isBooked
                      ? isMine
                        ? "Cancel"
                        : seat.userName || "Booked"
                      : "Book"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#fff",
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

  const DateSectionSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
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
        <Skeleton
          isDark={isDark}
          height={16}
          width="40%"
          style={{ alignSelf: "center", marginBottom: 12 }}
        />

        {/* Date tabs */}
        <HStack style={{ justifyContent: "space-between" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={36}
              width="22%"
              borderRadius={10}
            />
          ))}
        </HStack>

        {/* Dropdown + button */}
        <HStack style={{ marginTop: 12 }}>
          <Skeleton
            isDark={isDark}
            height={40}
            width="75%"
            borderRadius={8}
            style={{ marginRight: 10 }}
          />
          <Skeleton isDark={isDark} height={40} width={40} borderRadius={10} />
        </HStack>
      </ThemedView>
    );
  };

  const TeeRowSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <Box
        style={{
          marginBottom: 16,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#ffffff",
        }}
      >
        {/* Header */}
        <HStack style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <Skeleton isDark={isDark} height={16} width="30%" />
          <Skeleton isDark={isDark} height={12} width="20%" />
        </HStack>

        {/* Seats Grid (4 per row × 2 rows) */}
        <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={60}
              width="23%"
              borderRadius={10}
              style={{ marginBottom: 10 }}
            />
          ))}
        </HStack>
      </Box>
    );
  };

  const TeeTabsSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <HStack
        className="rounded-full p-1 mb-6"
        style={{
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(229, 231, 235, 0.6)",
        }}
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={i}
            isDark={isDark}
            height={40}
            width="48%"
            borderRadius={999}
            style={{ marginHorizontal: 4 }}
          />
        ))}
      </HStack>
    );
  };
  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        {/* HEADER */}
        <RenderHeader />
        <Watermark />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8BC34A"]}
              tintColor="#8BC34A"
            />
          }
        >
          <VStack className="px-4 pt-5 pb-20">
            {/* Date tabs */}
            <ThemedView
              style={{
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 12,
                shadowColor: "#000",
                // shadowOffset: { width: 0, height: 4 },
                // shadowOpacity: isDark ? 0.3 : 0.05,
                // shadowRadius: 12,
                // elevation: 2,
              }}
              className="mb-6"
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 16,
                  color: isDark ? "#94a3b8" : "#64748b",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Select Date
              </ThemedText>

              <HStack
                style={{
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                {availableDates.map((date: string, index: number) => {
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNumber = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                  });
                  const active = selectedDateIndex === index;

                  return (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedDateIndex(index)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 15,
                        alignItems: "center",
                        backgroundColor: active
                          ? "#8BC34A"
                          : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "#f8fafc",
                        borderWidth: 1,
                        borderColor: active
                          ? "#8BC34A"
                          : isDark
                            ? "rgba(255,255,255,0.1)"
                            : "#e2e8f0",
                        shadowColor: active ? "#8BC34A" : "transparent",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: active ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: active
                            ? "rgba(255,255,255,0.9)"
                            : isDark
                              ? "#94a3b8"
                              : "#64748b",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {dayName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "800",
                          color: active
                            ? "#fff"
                            : isDark
                              ? "#f1f5f9"
                              : "#1e293b",
                        }}
                      >
                        {dayNumber}
                      </Text>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: active
                            ? "rgba(255,255,255,0.8)"
                            : isDark
                              ? "#64748b"
                              : "#94a3b8",
                        }}
                      >
                        {monthName}
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
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 40,
                    // marginTop: 6,
                    borderColor: isDark ? "#333" : "#ddd",
                    flex: 1,
                    marginRight: 10,
                  }}
                  placeholderStyle={{ color: isDark ? "#777" : "#999" }}
                  selectedTextStyle={{ color: isDark ? "white" : "black" }}
                  containerStyle={{
                    backgroundColor: isDark ? "#1a1a1a" : "#fff",
                    borderColor: isDark ? "#333" : "#ddd",
                  }}
                  itemTextStyle={{ color: isDark ? "white" : "black" }}
                  activeColor={isDark ? "#333" : "#f0f0f0"}
                  data={courses}
                  labelField="label"
                  valueField="value"
                  mode="modal"
                  placeholder="Select Course"
                  value={selectedCourse}
                  onChange={(item) => {
                    setSelectedCourse(item.value);
                  }}
                />
                <Pressable
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: "#8BC34A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => fetchTeeTiming()}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Pressable>
              </HStack>
            </ThemedView>

            {/* Tee tabs */}
            <HStack
              className="p-1 mb-6"
              style={{
                flex: 1,
                paddingVertical: 5,
                borderWidth: 1,
                borderRadius: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                shadowColor: "#000",
                shadowOpacity: isDark ? 0.2 : 0.05,
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
                    className="flex-1 px-4 py-4 flex-row items-center justify-center"
                    style={[
                      { borderRadius: 30 },
                      active ? { backgroundColor: "#8BC34A" } : {},
                    ]}
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
              {loading ? (
                <>
                  <DateSectionSkeleton isDark={isDark} />
                  <TeeTabsSkeleton isDark={isDark} />

                  {/* Multiple fake cards */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TeeRowSkeleton key={i} isDark={isDark} />
                  ))}
                </>
              ) : (
                <>
                  {teeData?.slots?.map((slot: any) => (
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
                </>
              )}
            </Box>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
