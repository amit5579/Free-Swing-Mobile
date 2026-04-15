import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";

import {
  getLeaderboard,
  getTeeboxDetails,
  postSecretHoles,
} from "@/api/admin/tournaments";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/text";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LeaderboardPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeboxId, scoringType, secretHoles } =
    useLocalSearchParams();
  const strSecretHoles =
    typeof secretHoles === "string"
      ? secretHoles
      : Array.isArray(secretHoles)
        ? secretHoles[0]
        : undefined;

  const savedSecretHoles = strSecretHoles
    ? strSecretHoles
        .split(",")
        .filter((h) => h.trim() !== "")
        .map(Number)
    : [];

  const isDoublePreoria =
    scoringType === "double-peoria" ||
    scoringType === "double-peoria-net" ||
    scoringType === "double-peoria-stableford";
  // "stableford" "double-peoria-net"  "excluded" "double-peoria-stableford"  "standard" "double-peoria"

  const [selectedFront, setSelectedFront] = useState<number[]>([]);
  const [selectedBack, setSelectedBack] = useState<number[]>([]);

  const [disabledSubmit, setDisabledSubmit] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem("selectedHoles");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedFront(parsed.front || []);
        setSelectedBack(parsed.back || []);
        // console.log("ppp",parsed);
        setDisabledSubmit(false);
      }
    };

    loadData();
    fetchData();
  }, []);

  const onSubmit = async () => {
    try {
      const allSelectedHoles = [
        ...selectedFront,
        ...selectedBack,
        ...savedSecretHoles.filter(
          (h) => !selectedFront.includes(h) && !selectedBack.includes(h),
        ),
      ];
      await postSecretHoles(Number(tournamentId), allSelectedHoles);
      Toast.show({
        type: "success",
        text1: "Double Peoria Handicap calculated successfully",
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error calculating Double Peoria Handicap",
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const lb = await getLeaderboard(Number(tournamentId));
      const teebox = await getTeeboxDetails(Number(teeboxId));

      setLeaderboard(lb);
      setHoles(teebox);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const RenderHeader = () => {
    return (
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
        <HStack
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Leaderboard:
          </ThemedText>

          {loading ? (
            <Skeleton
              isDark={isDark}
              height={18}
              width={120}
              style={{ marginLeft: 8 }}
            />
          ) : (
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                marginLeft: 6,
              }}
            >
              {tournamentName}
            </ThemedText>
          )}
        </HStack>

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
    );
  };

  const RenderSecretHoles = () => {
    const isDark = colorScheme === "dark";

    if (!holes || holes.length === 0) return null;

    const border = isDark ? "#334155" : "#d1d5db";

    const secondaryText = isDark ? "#e7f0fcff" : "#6b7280";

    const HoleBox = ({ number, par }: { number: any; par: any }) => {
      const isSelected =
        number <= 9
          ? selectedFront.includes(number)
          : selectedBack.includes(number);

      const isDisabled =
        (number <= 9 &&
          selectedFront.length >= 6 &&
          !selectedFront.includes(number) &&
          !savedSecretHoles.includes(number)) ||
        (number > 9 &&
          selectedBack.length >= 6 &&
          !selectedBack.includes(number) &&
          !savedSecretHoles.includes(number)) ||
        (savedSecretHoles.length > 0 && !savedSecretHoles.includes(number));

      return (
        <Pressable
          disabled={isDisabled}
          onPress={() => {
            const isFront = number <= 9;

            if (isFront) {
              if (
                selectedFront.includes(number) ||
                savedSecretHoles.includes(number)
              ) {
                // remove
                setSelectedFront((prev) => prev.filter((h) => h !== number));
              } else {
                if (selectedFront.length >= 6) {
                  Toast.show({
                    type: "error",
                    text1: "You can select only 6 front holes",
                  });
                  return;
                }
                setSelectedFront((prev) => [...prev, number]);
              }
            } else {
              if (
                selectedBack.includes(number) ||
                savedSecretHoles.includes(number)
              ) {
                setSelectedBack((prev) => prev.filter((h) => h !== number));
              } else {
                if (selectedBack.length >= 6) {
                  Toast.show({
                    type: "error",
                    text1: "You can select only 6 back holes",
                  });
                  return;
                }
                setSelectedBack((prev) => [...prev, number]);
              }
            }
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: border,

            backgroundColor:
              isSelected || savedSecretHoles.includes(number)
                ? "#8bc34a"
                : isDisabled
                  ? isDark
                    ? "rgba(100, 116, 139, 0.3)"
                    : "rgba(203, 213, 225, 0.5)"
                  : isDark
                    ? "rgba(15, 23, 42, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",

            opacity: isDisabled ? 0.7 : 1,

            justifyContent: "center",
            alignItems: "center",
            margin: 4,
          }}
        >
          <ThemedText
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: isDark ? "#ffffffff" : "#020617",
            }}
          >
            {number}
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 10,
              color: secondaryText,
            }}
          >
            Par {par}
          </ThemedText>
        </Pressable>
      );
    };

    const frontNine = holes.slice(0, 9);
    const backNine = holes.slice(9, 18);

    return (
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {/* HEADER */}
        <ThemedText
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: isDark ? "#f1f5f9" : "#020617",
            marginBottom: 6,
          }}
        >
          Double Peoria: Secret Hole Selection
        </ThemedText>

        <ThemedText
          style={{
            fontSize: 12,
            color: secondaryText,
            marginBottom: 14,
          }}
        >
          Select exactly 6 holes from Front (1-9) and 6 from Back (10-18).
        </ThemedText>

        {/* FRONT NINE */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isDark ? "#f1f5f9" : "#020617",
            marginBottom: 8,
          }}
        >
          Front Nine (1-9)
        </ThemedText>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {frontNine.map((item: any, index: any) => (
            <HoleBox key={index} number={item.holeNumber} par={item.par} />
          ))}
        </View>

        {/* BACK NINE */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isDark ? "#f1f5f9" : "#020617",
            marginTop: 14,
            marginBottom: 8,
          }}
        >
          Back Nine (10-18)
        </ThemedText>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {backNine.map((item: any, index: any) => (
            <HoleBox key={index} number={item.holeNumber} par={item.par} />
          ))}
        </View>

        {/* Selected text */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "500",
          }}
        >
          Selected:
          <ThemedText
            style={{
              fontSize: 13,
              color: "#ef4444",
              fontWeight: "500",
            }}
          >
            {selectedFront.length ||
              savedSecretHoles.filter((h: any) => h <= 9).length}
            /6 Front |{" "}
            {selectedBack.length ||
              savedSecretHoles.filter((h: any) => h > 9).length}
            /6 Back
          </ThemedText>
        </ThemedText>
        {/* FOOTER */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "flex-end",
            marginTop: 10,
            justifyContent: "flex-end",
          }}
        >
          {/* Button */}
          <Pressable
            onPress={() => {
              const allSelectedHoles = [
                ...selectedFront,
                ...selectedBack,
                ...savedSecretHoles.filter(
                  (h) =>
                    !selectedFront.includes(h) && !selectedBack.includes(h),
                ),
              ];
              const frontCount =
                selectedFront.length ||
                savedSecretHoles.filter((h) => h <= 9).length;
              const backCount =
                selectedBack.length ||
                savedSecretHoles.filter((h) => h > 9).length;

              if (frontCount !== 6 || backCount !== 6) {
                setDisabledSubmit(true);
                Toast.show({
                  type: "error",
                  text1:
                    "Please select 6 holes from front and 6 holes from back",
                });
                return;
              } else {
                setDisabledSubmit(false);
              }
              onSubmit();
            }}
            disabled={disabledSubmit}
            style={{
              backgroundColor: disabledSubmit ? "#aad37bff" : "#8bc34a",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              Apply Peoria Formula
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const LeaderboardCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          borderColor: isDark ? "#333" : "#ddd",
        }}
      >
        {/* HEADER */}
        <HStack style={{ alignItems: "center" }}>
          <Skeleton isDark={isDark} height={30} width={30} borderRadius={15} />

          <VStack style={{ flex: 1, marginLeft: 10 }}>
            <Skeleton isDark={isDark} height={14} width="60%" />
            <Skeleton
              isDark={isDark}
              height={10}
              width="40%"
              style={{ marginTop: 4 }}
            />
          </VStack>

          <VStack>
            <Skeleton isDark={isDark} height={14} width={30} />
            <Skeleton
              isDark={isDark}
              height={10}
              width={20}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>

        {/* GRID (18 holes feel) */}
        <View style={{ marginTop: 10 }}>
          {[1, 2].map((row) => (
            <HStack key={row} style={{ marginBottom: 8 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton
                  key={i}
                  isDark={isDark}
                  height={28}
                  width={28}
                  borderRadius={14}
                  style={{ marginRight: 6 }}
                />
              ))}
            </HStack>
          ))}
        </View>

        {/* SUMMARY */}
        <HStack style={{ marginTop: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={14}
              width="18%"
              style={{ marginRight: 6 }}
            />
          ))}
        </HStack>

        {/* EXTRA */}
        <HStack style={{ marginTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={14}
              width="30%"
              style={{ marginRight: 6 }}
            />
          ))}
        </HStack>
      </View>
    );
  };

  const RANK_WIDTH = 40;
  const PLAYER_WIDTH = 90;
  const HCP_WIDTH = 50;
  const HOLE_WIDTH = 35;
  const TOTAL_WIDTH = 45;
  const STAT_WIDTH = 55;

  const LEFT_FIXED_WIDTH = RANK_WIDTH + PLAYER_WIDTH + HCP_WIDTH;

  const rightContentWidth = useMemo(() => {
    const holeCols = HOLE_WIDTH * 18;
    const totals = TOTAL_WIDTH * 2;
    const stats = STAT_WIDTH * 6; // GROSS, NET, PTS, EGL, BRD, PAR
    return holeCols + totals + stats;
  }, []);

  const TableHeaderLeft = () => (
    <HStack
      style={{
        height: 45,
        width: LEFT_FIXED_WIDTH,
        backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
        borderRightWidth: 1,
        borderColor: isDark ? "#334155" : "#e2e8f0",
      }}
    >
      <ThemedText style={[styles.headerText, { width: RANK_WIDTH }]}>
        RNK
      </ThemedText>
      <ThemedText
        style={[
          styles.headerText,
          { width: PLAYER_WIDTH, textAlign: "left", paddingLeft: 10 },
        ]}
      >
        PLAYER
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: HCP_WIDTH }]}>
        HCP
      </ThemedText>
    </HStack>
  );

  const TableHeaderRight = () => (
    <HStack
      style={{
        height: 45,
        width: rightContentWidth,
        backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText key={i} style={[styles.headerText, { width: HOLE_WIDTH }]}>
          {i + 1}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        OUT
      </ThemedText>
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText
          key={i + 9}
          style={[styles.headerText, { width: HOLE_WIDTH }]}
        >
          {i + 10}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        IN
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        GROSS
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        NET
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800" }]}
      >
        PTS
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        EGL
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        BRD
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: STAT_WIDTH }]}>
        PAR
      </ThemedText>
    </HStack>
  );

  const InfoRowLeft = ({ label }: { label: string }) => (
    <HStack
      style={{
        height: 40,
        width: LEFT_FIXED_WIDTH,
        borderBottomWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        borderRightWidth: 1,
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
      }}
    >
      <View style={{ width: RANK_WIDTH }} />
      <ThemedText style={[styles.infoLabel, { width: PLAYER_WIDTH }]}>
        {label}
      </ThemedText>
      <View style={{ width: HCP_WIDTH }} />
    </HStack>
  );

  const InfoRowRight = ({ data, type }: { data: any[]; type: "par" | "si" }) => (
    <HStack
      style={{
        height: 40,
        width: rightContentWidth,
        borderBottomWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
      }}
    >
      {data.slice(0, 9).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.handicap}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.slice(0, 9).reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      {data.slice(9, 18).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.handicap}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.slice(9, 18).reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      <ThemedText
        style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      <View style={{ width: STAT_WIDTH * 5 }} />
    </HStack>
  );

  const PlayerRowLeft = ({ player, index }: { player: any; index: number }) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? isDark
        ? "#0f172a"
        : "#fff"
      : isDark
        ? "#1e293b"
        : "#f8fafc";

    return (
      <HStack
        style={{
          height: 50,
          width: LEFT_FIXED_WIDTH,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark ? "#333" : "#eee",
          borderRightWidth: 1,
        }}
      >
        <ThemedText
          style={[styles.cellText, { width: RANK_WIDTH, fontWeight: "600" }]}
        >
          {player.rank || "-"}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={[
            styles.cellText,
            {
              width: PLAYER_WIDTH,
              textAlign: "left",
              paddingLeft: 10,
              fontWeight: "600",
            },
          ]}
        >
          {player.playerName}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: HCP_WIDTH }]}>
          {player.handicap}
        </ThemedText>
      </HStack>
    );
  };

  const PlayerRowRight = ({ player, index }: { player: any; index: number }) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? isDark
        ? "#0f172a"
        : "#fff"
      : isDark
        ? "#1e293b"
        : "#f8fafc";

    return (
      <HStack
        style={{
          height: 50,
          width: rightContentWidth,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark ? "#333" : "#eee",
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 1];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.front9}
        </ThemedText>
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 10];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.back9}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH, fontWeight: "800" }]}>
          {player.gross}
        </ThemedText>
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#3b82f6" },
          ]}
        >
          {player.net}
        </ThemedText>
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#16a34a" },
          ]}
        >
          {player.points}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.eagles}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.birdies}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: STAT_WIDTH }]}>
          {player.pars}
        </ThemedText>
      </HStack>
    );
  };

  const TableLoadingSkeleton = () => {
    const rows = 8;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <HStack style={{ borderTopWidth: 1, borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
          {/* Left fixed skeleton */}
          <VStack style={{ width: LEFT_FIXED_WIDTH }}>
            <View
              style={{
                height: 45,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderRightWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
                justifyContent: "center",
                paddingHorizontal: 10,
              }}
            >
              <Skeleton isDark={isDark} height={12} width={120} />
            </View>
            {Array.from({ length: rows }).map((_, i) => (
              <HStack
                key={i}
                style={{
                  height: 50,
                  borderBottomWidth: 0.5,
                  borderColor: isDark ? "#333" : "#eee",
                  borderRightWidth: 1,
                  paddingHorizontal: 8,
                  alignItems: "center",
                  gap: 8,
                  backgroundColor:
                    i % 2 === 0
                      ? isDark
                        ? "#0f172a"
                        : "#fff"
                      : isDark
                        ? "#1e293b"
                        : "#f8fafc",
                }}
              >
                <Skeleton isDark={isDark} height={12} width={20} />
                <Skeleton isDark={isDark} height={12} width={60} />
                <Skeleton isDark={isDark} height={12} width={25} />
              </HStack>
            ))}
          </VStack>

          {/* Right scrollable skeleton */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <VStack style={{ width: rightContentWidth }}>
              <View
                style={{
                  height: 45,
                  backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                  justifyContent: "center",
                  paddingHorizontal: 10,
                }}
              >
                <Skeleton isDark={isDark} height={12} width={220} />
              </View>

              {Array.from({ length: rows }).map((_, r) => (
                <HStack
                  key={r}
                  style={{
                    height: 50,
                    borderBottomWidth: 0.5,
                    borderColor: isDark ? "#333" : "#eee",
                    backgroundColor:
                      r % 2 === 0
                        ? isDark
                          ? "#0f172a"
                          : "#fff"
                        : isDark
                          ? "#1e293b"
                          : "#f8fafc",
                    paddingHorizontal: 6,
                    alignItems: "center",
                  }}
                >
                  {Array.from({ length: 10 }).map((__, c) => (
                    <View
                      key={c}
                      style={{
                        width: c === 9 ? TOTAL_WIDTH : HOLE_WIDTH,
                        alignItems: "center",
                      }}
                    >
                      <Skeleton isDark={isDark} height={12} width={18} />
                    </View>
                  ))}
                  <View style={{ width: 12 }} />
                  <Skeleton isDark={isDark} height={12} width={260} />
                </HStack>
              ))}
            </VStack>
          </ScrollView>
        </HStack>
      </ScrollView>
    );
  };
  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <RenderHeader />
        <Watermark />

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          {loading ? (
            <TableLoadingSkeleton />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {isDoublePreoria && <RenderSecretHoles />}

              <HStack
                style={{
                  borderTopWidth: 1,
                  borderColor: isDark ? "#1e293b" : "#e2e8f0",
                  marginTop: isDoublePreoria ? 8 : 0,
                }}
              >
                {/* Fixed left block */}
                <VStack style={{ width: LEFT_FIXED_WIDTH }}>
                  <TableHeaderLeft />
                  {holes.length > 0 && (
                    <>
                      <InfoRowLeft label="COURSE PAR" />
                      <InfoRowLeft label="STROKE INDEX" />
                    </>
                  )}
                  {leaderboard.map((player, idx) => (
                    <PlayerRowLeft key={player.userId} player={player} index={idx} />
                  ))}
                </VStack>

                {/* Horizontally scrollable right block */}
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <VStack style={{ width: rightContentWidth }}>
                    <TableHeaderRight />
                    {holes && (
                      <>
                        <InfoRowRight data={holes} type="par" />
                        <InfoRowRight data={holes} type="si" />
                      </>
                    )}
                    {leaderboard.map((player, idx) => (
                      <PlayerRowRight key={player.userId} player={player} index={idx} />
                    ))}
                  </VStack>
                </ScrollView>
              </HStack>
               {leaderboard.length ==0 && (
                      <ThemedText style={{textAlign:"center" , marginTop: 3}}>No Players or scores available yet.</ThemedText>
                    )}
            </ScrollView>
          )}
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 45,
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 50,
  },
  infoCellText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 40,
    opacity: 0.6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "left",
    paddingLeft: 10,
    lineHeight: 40,
    color: "#84cc16",
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
  },
});
