import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
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
  authenticateScores,
} from "@/api/modules/admin/tournaments.api";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/text";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SubAdminLeaderboardPage() {
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

  const savedSecretHoles = useMemo(() => {
    return strSecretHoles
      ? strSecretHoles
          .split(",")
          .filter((h) => h.trim() !== "")
          .map(Number)
      : [];
  }, [strSecretHoles]);

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

  // ── Colors ──
  const colors = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b",
    iconBg: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.8)",
  };

  const getScoringLabel = (scoringType: any) => {
    switch (scoringType) {
      case "double-peoria-stableford":
        return "Double Peoria Stableford";
      case "double-peoria":
        return "Double Peoria Net";
      case "double-peoria-net":
        return "Double Peoria Net";
      case "stableford":
        return "Stableford";
      case "excluded":
        return "Practice Round";
      default:
        return "Gross / Net";
    }
  };

  const RANK_WIDTH = 40;
  const PLAYER_WIDTH = 90;
  const HCP_WIDTH = 50;
  const HOLE_WIDTH = 35;
  const TOTAL_WIDTH = 45;
  const STAT_WIDTH = 55;
  const ACTIONS_WIDTH = 100;

  const LEFT_FIXED_WIDTH = RANK_WIDTH + PLAYER_WIDTH + HCP_WIDTH;

  const rightContentWidth = useMemo(() => {
    const holeCols = HOLE_WIDTH * 18;
    const totals = TOTAL_WIDTH * 2;
    const stats = STAT_WIDTH * 6; // GROSS, NET, PTS, EGL, BRD, PAR
    return holeCols + totals + stats + ACTIONS_WIDTH;
  }, []);

  const EmptyState = () => (
    <VStack
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          backgroundColor: colors.iconBg,
          padding: 18,
          borderRadius: 50,
          marginBottom: 16,
        }}
      >
        <Ionicons name="stats-chart-outline" size={32} color={colors.subText} />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 6,
        }}
      >
        Leaderboard Empty
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          color: colors.subText,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        No scores have been submitted for this tournament yet. The leaderboard
        will automatically populate as soon as players complete their rounds.
      </ThemedText>
    </VStack>
  );

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

    AsyncStorage.setItem(
      "selectedHoles",
      JSON.stringify({ front: selectedFront, back: selectedBack }),
    );
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
      // console.log("selectedHoles", allSelectedHoles);
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

  const handleAuthenticate = async (player: any) => {
    if (!player.scorecardId) {
      Toast.show({
        type: "error",
        text1: "No scorecard ID found for player",
      });
      return;
    }
    try {
      await authenticateScores(player.scorecardId);
      Toast.show({
        type: "success",
        text1: "Player authenticated successfully",
      });
      setLeaderboard((prev) =>
        prev.map((p) =>
          p.userId === player.userId ? { ...p, isAuthenticated: true } : p
        )
      );
    } catch (error) {
      console.log("Auth error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to authenticate the player",
      });
    }
  };

  const renderHeader = () => {
    return (
      <VStack
        style={{
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        <HStack
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#020617" : "#ffffff",
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
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#fff" : "#020617"}
            />
          </Pressable>

          {/* 🧠 TITLE BLOCK */}
          <VStack
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
            }}
          >
            {/* LABEL */}
            <ThemedText
              style={{
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
                fontWeight: "500",
              }}
            >
              Leaderboard
            </ThemedText>

            {/* MAIN TITLE */}
            <ThemedText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 17,
                fontWeight: "700",
                marginTop: 2,
                maxWidth: "85%",
                textAlign: "center",
              }}
            >
              {tournamentName}
            </ThemedText>
          </VStack>

          {/* ⚖️ RIGHT PLACEHOLDER */}
          <View style={{ width: 40 }} />
        </HStack>
      </VStack>
    );
  };

  const RenderStatsSection = () => {
    const isDark = colorScheme === "dark";
    const secondaryText = isDark ? "#94a3b8" : "#64748b";

    return (
      <View style={{ paddingHorizontal: 3, paddingVertical: 8 }}>
        {/* TOP TAGS */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: 10,
          }}
        >
          {/* Left Tag */}
          <View
            style={{
              backgroundColor: isDark ? "#134e4a" : "#d1fae5",
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#5eead4" : "#065f46",
              }}
            >
              TOURNAMENT SCOREBOARD
            </ThemedText>
          </View>

          {/* Right Badge */}
          <View
            style={{
              backgroundColor: isDark ? "#1e40af" : "#e0f2fe",
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#93c5fd" : "#0369a1",
              }}
            >
              {getScoringLabel(scoringType as string)}
            </ThemedText>
          </View>
        </View>

        {/* SUBTITLE */}
        <ThemedText
          style={{
            fontSize: 12,
            color: secondaryText,
            marginVertical: 14,
            marginHorizontal: 10,
          }}
        >
          Hole-by-hole scoring with cleaner front nine, back nine, totals, and
          player stat sections.
        </ThemedText>
      </View>
    );
  };

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
      <ThemedText style={[styles.headerText, { width: ACTIONS_WIDTH }]}>
        ACTIONS
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

  const InfoRowRight = ({
    data,
    type,
  }: {
    data: any[];
    type: "par" | "si";
  }) => (
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
          {type === "par" ? h.par : h.strokeIndex}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par"
          ? data.slice(0, 9).reduce((s, h) => s + (h.par || 0), 0)
          : "-"}
      </ThemedText>
      {data.slice(9, 18).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.strokeIndex}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par"
          ? data.slice(9, 18).reduce((s, h) => s + (h.par || 0), 0)
          : "-"}
      </ThemedText>
      <ThemedText
        style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" ? data.reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      <View style={{ width: STAT_WIDTH * 5 + ACTIONS_WIDTH }} />
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

  const PlayerRowRight = ({
    player,
    index,
  }: {
    player: any;
    index: number;
  }) => {
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
        <ThemedText
          style={[styles.cellText, { width: STAT_WIDTH, fontWeight: "800" }]}
        >
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

        {/* Actions Cell */}
        <HStack
          style={{
            width: ACTIONS_WIDTH,
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 8,
          }}
        >
          {/* View Scorecard Button (with Eye icon) */}
          <Pressable
            disabled={!player.scorecardId}
            onPress={() => {
              routePage.push({
                pathname: "/(drawer)/(subAdmin)/(tabs)/tournaments/playerScorecard",
                params: {
                  scorecardId: player.scorecardId,
                },
              });
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(6, 182, 212, 0.15)" : "#ecfeff",
              borderWidth: 1,
              borderColor: "#06b6d4",
              borderRadius: 6,
              paddingVertical: 4,
              paddingHorizontal: 8,
              height: 32,
              opacity: player.scorecardId ? 1 : 0.4,
            }}
          >
            <Ionicons name="eye-outline" size={14} color="#06b6d4" style={{ marginRight: 4 }} />
            <ThemedText style={{ color: "#06b6d4", fontSize: 11, fontWeight: "600" }}>View</ThemedText>
          </Pressable>
        </HStack>
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
                    ? "rgba(33, 45, 73, 0.7)"
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
            /6 Back{" "}
          </ThemedText>
        </ThemedText>

        {/* FOOTER */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 7,
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

  const TableLoadingSkeleton = () => {
    const rows = 8;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <HStack
          style={{
            borderTopWidth: 1,
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          }}
        >
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
    <ThemedView style={{ flex: 1 }}>
      {renderHeader()}
      <Watermark />

      {loading ? (
        <TableLoadingSkeleton />
      ) : (
        <ScrollView style={{ flex: 1, marginBottom: 30 }}>
          <RenderStatsSection />

          {isDoublePreoria && <RenderSecretHoles />}

          {leaderboard.length === 0 ? (
            <EmptyState />
          ) : (
            <HStack
              style={{
                borderTopWidth: 1,
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
              }}
            >
              {/* LEFT FIXED */}
              <VStack style={{ width: LEFT_FIXED_WIDTH }}>
                <TableHeaderLeft />
                <InfoRowLeft label="PAR" />
                <InfoRowLeft label="SI" />
                {leaderboard.map((p, i) => (
                  <PlayerRowLeft key={p.userId} player={p} index={i} />
                ))}
              </VStack>

              {/* RIGHT SCROLLABLE */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <VStack style={{ width: rightContentWidth }}>
                  <TableHeaderRight />
                  <InfoRowRight data={holes} type="par" />
                  <InfoRowRight data={holes} type="si" />
                  {leaderboard.map((p, i) => (
                    <PlayerRowRight key={p.userId} player={p} index={i} />
                  ))}
                </VStack>
              </ScrollView>
            </HStack>
          )}
          {leaderboard.length == 0 && (
            <ThemedText style={{ textAlign: "center", marginTop: 3 }}>
              No Players or scores available yet.
            </ThemedText>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    textAlignVertical: "center",
    height: 45,
    lineHeight: 45,
  },
  cell: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
    textAlignVertical: "center",
    height: 50,
    lineHeight: 50,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "left",
    paddingLeft: 10,
    height: 40,
    lineHeight: 40,
  },
  infoCellText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    height: 40,
    lineHeight: 40,
  },
});
