import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";

import { HStack } from "@/components/hstack";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { Dropdown } from "react-native-element-dropdown";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelSeatBooking,
  getSubAdminCourses,
  getSubAdminTeeTimeSeats,
} from "@/api/teeTime";

export default function SubAdminTeeBookingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const [activeTeeTab, setActiveTeeTab] = useState(1);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [teeData, setTeeData] = useState<any>(null);
  const [loadingSeats, setLoadingSeats] = useState<any>({});

  // const [userId, setUserId] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchCourses = async () => {
    try {
      const courseResponse = await getSubAdminCourses();
      const formattedCourses = courseResponse.map((c: any) => ({
        label: c.name || `Course ${c.courseId}`,
        value: c.courseId,
      }));
      setCourses(formattedCourses);
      if (formattedCourses.length > 0) {
        setSelectedCourse(formattedCourses[0].value);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchTeeTiming = async () => {
    // debugger;
    if (!availableDates[selectedDateIndex]) return;
    try {
      setLoading(true);
      const teeDetails = await getSubAdminTeeTimeSeats(
        selectedCourse,
        availableDates[selectedDateIndex],
        activeTeeTab,
      );
      setTeeData(teeDetails);
    } catch (error) {
      console.error("Error fetching tee timings:", error);
    } finally {
      setLoading(false);
    }
  };

  // const getUserId = async () => {
  //   try {
  //     const id = await AsyncStorage.getItem("userId");
  //     if (id) {
  //       setUserId(Number(id));
  //     }
  //   } catch (err) {
  //     console.error("Error fetching userId:", err);
  //   }
  // };

  useEffect(() => {
    fetchCourses();
  }, []);

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchTeeTiming();
  //   }, [])
  // )

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

  const handleDownloadPDF = async () => {
    if (!teeData || !teeData.slots) {
      Toast.show({
        type: "info",
        text1: "No Data",
        text2: "There is no data to download",
      });
      return;
    }

    try {
      const courseName =
        courses.find((c) => c.value === selectedCourse)?.label || "Course";
      const dateStr = formatDateString(availableDates[selectedDateIndex]);
      const teeBoxName = activeTeeTab === 1 ? "Tee 1" : "Tee 10";

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #8BC34A; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; color: #2E7D32; margin-bottom: 5px; }
              .info { font-size: 14px; color: #666; margin-bottom: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #8BC34A; color: white; padding: 12px; text-align: left; font-size: 14px; }
              td { border-bottom: 1px solid #eee; padding: 12px; font-size: 13px; }
              .time-slot { font-weight: bold; color: #334155; width: 100px; }
              .seat-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
              .booked { background-color: #E8F5E9; color: #2E7D32; }
              .empty { color: #94a3b8; font-style: italic; }
              .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Tee Time Booking Report</div>
              <div class="info"><strong>Course:</strong> ${courseName}</div>
              <div class="info"><strong>Date:</strong> ${dateStr} | <strong>Tee Box:</strong> ${teeBoxName}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Seat 1</th>
                  <th>Seat 2</th>
                  <th>Seat 3</th>
                  <th>Seat 4</th>
                </tr>
              </thead>
              <tbody>
                ${teeData.slots
                  .map(
                    (slot: any) => `
                  <tr>
                    <td class="time-slot">${slot.time}</td>
                    ${[1, 2, 3, 4]
                      .map((num) => {
                        const seat = slot.seats.find(
                          (s: any) => s.seatNumber === num,
                        );
                        if (seat && seat.isBooked) {
                          return `<td><span class="seat-badge booked">${seat.userName || "Booked"}</span></td>`;
                        }
                        return `<td><span class="empty">Empty</span></td>`;
                      })
                      .join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="footer">
              Generated by Free Swing App on ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to generate PDF",
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
      <>
        <VStack className="px-3 mt-1 items-center">
          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Tee time booking
          </ThemedText>
          <ThemedText style={{fontSize:12,textAlign:"center",color:isDark?"#fff":"#111"}}>Choose your date, tee, and seat from the same shared page layout used across the app.</ThemedText>
        </VStack>
        <HStack className="justify-end m-3">
          <Pressable
            onPress={handleDownloadPDF}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark
                ? "rgba(139, 195, 74, 0.1)"
                : "rgba(139, 195, 74, 0.05)",
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 9,
              marginTop: 4,
              borderWidth: 1,
              borderColor: "rgba(139, 195, 74, 0.3)",
            }}
          >
            <Ionicons name="download-outline" size={16} color="#8BC34A" />
            <Text
              style={{
                marginLeft: 6,
                color: "#8BC34A",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Print / Download Report
            </Text>
          </Pressable>
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
 backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",          shadowColor: "#000",
          shadowOpacity: isDark ? 0.2 : 0.05,
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
            // Robust booking detection: check for the isBooked boolean, a bookingId, or a status of "Booked"
            // const isBooked = seat?.isBooked || !!seat?.bookingId || seat?.status === "Booked" || (seat?.userName && seat.userName.trim() !== "");
            const isBooked = seat?.isBooked;
            const date = availableDates[selectedDateIndex];
            const teeBox = activeTeeTab;
            const key = getSeatKey(date, teeBox, slot.time, seat.seatNumber);
            const isLoading = loadingSeats[key];
            if (!isBooked) {
              // console.log("seat",seat);

              return (
                <View
                  key={seat.id ?? `${slot.time}-${index}`}
                  style={{
                    width: "23%",
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: isDark ? "#334155" : "#cbd5e1",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "500",
                      color: isDark ? "#475569" : "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Empty
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isDark ? "#334155" : "#cbd5e1",
                      marginTop: 2,
                    }}
                  >
                    Seat {seat.seatNumber}
                  </Text>
                </View>
              );
            }

            return (
              <Pressable
                key={seat.id ?? `${slot.time}-${index}`}
                onPress={() => {
                  if (isLoading) return;
                  if (seat.bookingId) {
                    cancelBookingHandler(
                      seat.bookingId,
                      slot.time,
                      seat.seatNumber,
                    );
                  }
                }}
                disabled={isLoading}
                style={{
                  width: "23%",
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginBottom: 10,
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderWidth: 1.5,
                  borderColor: "#8BC34A",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View style={{ position: "absolute", top: 4, right: 4 }}>
                  <Ionicons name="close-circle" size={14} color="#ef4444" />
                </View>

                <Ionicons
                  name={isLoading ? "hourglass-outline" : "person-circle"}
                  size={24}
                  color="#8BC34A"
                  style={{ marginBottom: 2 }}
                />

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isDark ? "#f8fafc" : "#1e293b",
                    textAlign: "center",
                    width: "90%",
                  }}
                  numberOfLines={1}
                >
                  {isLoading
                    ? "Wait"
                    : (seat.userName || "Occupied").split(" ")[0]}
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#8BC34A",
                    marginTop: 2,
                  }}
                >
                  Booked
                  {/* {isBooked ? "Booked" : "Seat " + seat.seatNumber} */}
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
      <View
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
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
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
                paddingVertical: 4,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                 backgroundColor: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
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
                      color={active ? "#fff" : isDark ? "#e2e8f0" : "#6b7280"}
                      className="mr-1"
                    />
                    <Text
                      className={`text-md font-medium ${active ? "text-white" : isDark ? "text-gray-300" : "text-gray-600"}`}
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
      </View>
    </>
  );
}
